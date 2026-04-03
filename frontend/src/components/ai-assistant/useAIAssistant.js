import { useState, useCallback } from 'react';
import { PROJECT_FIELDS, detectLanguage, getQuestion, getExample } from './aiConfig';

export function useAIAssistant(onComplete, onCancel) {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [userLanguage, setUserLanguage] = useState('fr');
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialsInput, setMaterialsInput] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);

  const currentField = PROJECT_FIELDS[currentStep];

  const askNextQuestion = useCallback((step) => {
    const field = PROJECT_FIELDS[step];
    if (!field) return;
    const question = getQuestion(field, userLanguage);
    const example = getExample(field, userLanguage);
    const questionMessage = {
      id: Date.now(),
      type: 'ai',
      text: `${question}\n\n💡 ${example}`,
      field: field.name
    };
    setMessages(prev => [...prev, questionMessage]);
  }, [userLanguage]);

  // ✅ Modified: accepts optional immediateImages parameter
  const completeAndSubmit = useCallback(async (immediateImages = null) => {
    setIsSubmitting(true);

    const mapStatusToEnum = (statusValue) => {
      if (!statusValue) return 'PENDING';
      const statusLower = String(statusValue).toLowerCase().trim();
      if (statusLower === 'actif' || statusLower === 'active' || statusLower === 'activ' || statusLower === 'نشط') return 'ACTIVE';
      if (statusLower === 'terminé' || statusLower === 'termine' || statusLower === 'completed' ||
          statusLower === 'complete' || statusLower === 'terminer' || statusLower === 'مكتمل') return 'COMPLETED';
      return 'PENDING';
    };
    
    const finalImages = immediateImages !== null ? immediateImages : selectedImages;
    
    const projectData = {
      title: answers.title,
      category: answers.category,
      status: mapStatusToEnum(answers.status),
      description: answers.description || '',
      city: answers.city,
      address: answers.address || '',
      budgetTND: answers.budgetTND || 0,
      surfaceM2: answers.surfaceM2 || 0,
      startDate: answers.startDate || null,
      endDate: answers.endDate || null,
      phoneNumber: answers.phoneNumber,
      contactPhone: answers.phoneNumber,
      materials: answers.materials || [],
      images: finalImages
    };
    
    const summaryMsg = {
      id: Date.now(),
      type: 'ai',
      text: {
        ar: `📋 ملخص المشروع:\n\nالعنوان: ${projectData.title}\nالفئة: ${projectData.category}\nالولاية: ${projectData.city}\nالميزانية: ${projectData.budgetTND} TND\n\nباش نوخذو للمراجعة وننشئو المشروع...`,
        fr: `📋 Résumé du projet:\n\nTitre: ${projectData.title}\nCatégorie: ${projectData.category}\nVille: ${projectData.city}\nBudget: ${projectData.budgetTND} TND\n\nJe vais vérifier et créer le projet...`,
        en: `📋 Project Summary:\n\nTitle: ${projectData.title}\nCategory: ${projectData.category}\nCity: ${projectData.city}\nBudget: ${projectData.budgetTND} TND\n\nI'll review and create the project...`
      }[userLanguage]
    };
    setMessages(prev => [...prev, summaryMsg]);
    
    try {
      await onComplete(projectData);
      setIsComplete(true);
      const successMsg = {
        id: Date.now(),
        type: 'ai',
        text: {
          ar: '✅ تم إنشاء المشروع بنجاح! تقدر تشوفو في القائمة.',
          fr: '✅ Projet créé avec succès! Vous pouvez le voir dans la liste.',
          en: '✅ Project created successfully! You can see it in the list.'
        }[userLanguage]
      };
      setMessages(prev => [...prev, successMsg]);
      setTimeout(() => onCancel(), 2000);
    } catch (error) {
      const errorMsg = {
        id: Date.now(),
        type: 'ai',
        text: {
          ar: `❌ عفوا، ما قدرناش ننشئو المشروع: ${error.message}`,
          fr: `❌ Désolé, impossible de créer le projet: ${error.message}`,
          en: `❌ Sorry, couldn't create the project: ${error.message}`
        }[userLanguage]
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, userLanguage, onComplete, onCancel, selectedImages]);

  const processAnswer = useCallback(async (answer) => {
    if (!currentField) return;
    const userMessage = { id: Date.now(), type: 'user', text: answer };
    setMessages(prev => [...prev, userMessage]);
    
    if (currentStep === 0 && Object.keys(answers).length === 0) {
      setUserLanguage(detectLanguage(answer));
    }
    
    let processedAnswer = answer.trim();
    let isValid = true;
    let errorMessage = null;
    
    if (currentField.validation) {
      const validationError = currentField.validation(processedAnswer);
      if (validationError) { isValid = false; errorMessage = validationError; }
    }
    
    if (currentField.type === 'number') {
      const num = parseFloat(processedAnswer);
      if (!isNaN(num)) processedAnswer = num;
      else if (processedAnswer && isValid) {
        isValid = false;
        errorMessage = 'Veuillez entrer un nombre valide / رجاء أدخل رقماً صحيحاً';
      }
    }
    
    if (currentField.type === 'materials') {
      processedAnswer = [];
    }
    
    if (currentField.type === 'images') {
      // If user types something, treat as skip? Actually we handle images via dedicated UI.
      // So just move to next step with empty images.
      const nextStep = currentStep + 1;
      if (nextStep >= PROJECT_FIELDS.length) {
        await completeAndSubmit([]);
      } else {
        setCurrentStep(nextStep);
        askNextQuestion(nextStep);
      }
      return;
    }
    
    if (!isValid && errorMessage) {
      const errorMsg = {
        id: Date.now(),
        type: 'ai',
        text: `❌ ${errorMessage}\n\n${getQuestion(currentField, userLanguage)}\n\n💡 ${getExample(currentField, userLanguage)}`
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }
    
    let finalAnswer = processedAnswer;
    if (currentField.name === 'status') {
      const statusLower = String(processedAnswer).toLowerCase().trim();
      if (statusLower === 'actif' || statusLower === 'active' || statusLower === 'نشط') finalAnswer = 'ACTIVE';
      else if (statusLower === 'terminé' || statusLower === 'termine' || statusLower === 'completed' ||
               statusLower === 'terminer' || statusLower === 'مكتمل') finalAnswer = 'COMPLETED';
      else finalAnswer = 'PENDING';
    }
    
    if (currentField.type === 'materials') {
      setAnswers(prev => ({ ...prev, [currentField.name]: [] }));
    } else {
      setAnswers(prev => ({ ...prev, [currentField.name]: finalAnswer }));
    }
    
    const nextStep = currentStep + 1;
    if (nextStep >= PROJECT_FIELDS.length) {
      await completeAndSubmit();
    } else {
      setCurrentStep(nextStep);
      askNextQuestion(nextStep);
    }
  }, [currentField, currentStep, answers, userLanguage, askNextQuestion, completeAndSubmit]);

  const addMaterial = useCallback((material) => {
    if (!material.trim()) return;
    const currentMaterials = answers.materials || [];
    if (currentMaterials.length >= 12) {
      const warningMsg = {
        id: Date.now(),
        type: 'ai',
        text: {
          ar: '❌ لا يمكنك إضافة أكثر من 12 مادة',
          fr: '❌ Vous ne pouvez pas ajouter plus de 12 matériaux',
          en: '❌ You cannot add more than 12 materials'
        }[userLanguage]
      };
      setMessages(prev => [...prev, warningMsg]);
      return;
    }
    const newMaterials = [...currentMaterials, material.trim()];
    setAnswers(prev => ({ ...prev, materials: newMaterials }));
    setMaterialsInput('');
    const moreMsg = {
      id: Date.now(),
      type: 'ai',
      text: {
        ar: `✅ تمت إضافة "${material}". عندك مواد أخرين؟ (قول "لا" باش نمشيو للخطوة اللي بعد)`,
        fr: `✅ "${material}" ajouté. Avez-vous d'autres matériaux ? (dites "non" pour continuer)`,
        en: `✅ "${material}" added. Any other materials? (say "no" to continue)`
      }[userLanguage]
    };
    setMessages(prev => [...prev, moreMsg]);
  }, [answers.materials, userLanguage]);

  const finishMaterials = useCallback(() => {
    const nextStep = currentStep + 1;
    if (nextStep >= PROJECT_FIELDS.length) {
      completeAndSubmit();
    } else {
      setCurrentStep(nextStep);
      askNextQuestion(nextStep);
    }
  }, [currentStep, askNextQuestion, completeAndSubmit]);

  // ✅ Fixed: pass files directly to completeAndSubmit
  const addImages = useCallback((files) => {
    if (files.length > 6) {
      const warningMsg = {
        id: Date.now(),
        type: 'ai',
        text: {
          ar: '❌ لا يمكنك إضافة أكثر من 6 صور',
          fr: '❌ Vous ne pouvez pas ajouter plus de 6 images',
          en: '❌ You cannot add more than 6 images'
        }[userLanguage]
      };
      setMessages(prev => [...prev, warningMsg]);
      return;
    }
    setSelectedImages(files);
    const confirmMsg = {
      id: Date.now(),
      type: 'ai',
      text: {
        ar: `✅ تم اختيار ${files.length} صورة. شكراً! باش نمشيو للخطوة اللي بعد.`,
        fr: `✅ ${files.length} image(s) sélectionnée(s). Merci! Je passe à l'étape suivante.`,
        en: `✅ ${files.length} image(s) selected. Thanks! Moving to next step.`
      }[userLanguage]
    };
    setMessages(prev => [...prev, confirmMsg]);
    // ✅ Submit immediately with the files
    completeAndSubmit(files);
  }, [userLanguage, completeAndSubmit]);

  const skipImages = useCallback(() => {
    setSelectedImages([]);
    const skipMsg = {
      id: Date.now(),
      type: 'ai',
      text: {
        ar: '✅ حسناً، بدون صور. باش نمشيو للخطوة اللي بعد.',
        fr: '✅ D\'accord, sans images. Je passe à l\'étape suivante.',
        en: '✅ Okay, no images. Moving to next step.'
      }[userLanguage]
    };
    setMessages(prev => [...prev, skipMsg]);
    // ✅ Submit with empty array
    completeAndSubmit([]);
  }, [userLanguage, completeAndSubmit]);

  const startConversation = useCallback(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      text: {
        ar: 'أهلا بك! باش نعملو مشروع جديد مع بعض. راح نسألك شوية أسئلة. جاوب بالطريقة اللي ترتاحلها.',
        fr: 'Bonjour! Je vais vous aider à créer un nouveau projet. Je vais vous poser quelques questions. Répondez simplement.',
        en: 'Hello! I\'ll help you create a new project. I\'ll ask you a few questions. Just answer naturally.'
      }[userLanguage]
    };
    setMessages([welcomeMessage]);
    askNextQuestion(0);
  }, [userLanguage, askNextQuestion]);

  const reset = useCallback(() => {
    setMessages([]);
    setCurrentStep(0);
    setAnswers({});
    setUserLanguage('fr');
    setIsComplete(false);
    setIsSubmitting(false);
    setMaterialsInput('');
    setSelectedImages([]);
  }, []);

  return {
    messages,
    currentStep,
    answers,
    userLanguage,
    isComplete,
    isSubmitting,
    currentField,
    materialsInput,
    setMaterialsInput,
    selectedImages,
    startConversation,
    processAnswer,
    addMaterial,
    finishMaterials,
    addImages,
    skipImages,
    reset
  };
}