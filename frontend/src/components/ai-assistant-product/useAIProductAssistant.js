import { useState, useCallback, useEffect } from 'react';
import { detectCategory, generateDescription, suggestPriceAndStock } from './aiProductConfig';
import { getSupplierCategories } from '../../auth/api';

export function useAIProductAssistant(onComplete, onCancel, token) {
  const [messages, setMessages] = useState([]);
  const [answers, setAnswers] = useState({});
  const [userLanguage, setUserLanguage] = useState('fr');
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDescriptionButtons, setShowDescriptionButtons] = useState(false);
  const [showImageButtons, setShowImageButtons] = useState(false);
  const [showPdfButtons, setShowPdfButtons] = useState(false);

  useEffect(() => {
    if (token) {
      getSupplierCategories({ token })
        .then(res => { if (res?.data) setAvailableCategories(res.data); })
        .catch(console.error);
    }
  }, [token]);

  const addMessage = (type, text, buttons = null) => {
    setMessages(prev => [...prev, { id: Date.now(), type, text, buttons }]);
  };

  const askName = useCallback(() => {
    const question = {
      fr: "Quel est le nom du produit ?\n\n💡 Exemple: CEM II 42.5 Cement, Lampe LED 10W",
      en: "What is the product name?\n\n💡 Example: CEM II 42.5 Cement, 10W LED Lamp",
      ar: "شنوّة إسم المنتج؟\n\n💡 مثال: أسمنت CEM II 42.5، لامبة LED 10W"
    }[userLanguage] || "Quel est le nom du produit ?";
    addMessage('ai', question);
  }, [userLanguage]);

  const askDescriptionChoice = useCallback(() => {
    const question = {
      fr: "Souhaitez-vous écrire la description ou que je la génère ?",
      en: "Do you want to write the description or should I generate it?",
      ar: "تحب تكتب الوصف ولا توليده؟"
    }[userLanguage] || "Souhaitez-vous écrire la description ou que je la génère ?";
    addMessage('ai', question, [
      { label: { fr: "Manuel", en: "Manual", ar: "يدوي" }[userLanguage] || "Manuel", value: "manual" },
      { label: { fr: "Générer", en: "Generate", ar: "توليد" }[userLanguage] || "Générer", value: "generate" }
    ]);
    setShowDescriptionButtons(true);
  }, [userLanguage]);

  const askManualDescription = useCallback(() => {
    const question = {
      fr: "Écrivez la description du produit :",
      en: "Write the product description:",
      ar: "أكتب وصف المنتج:"
    }[userLanguage] || "Écrivez la description du produit :";
    addMessage('ai', question);
    setShowDescriptionButtons(false);
  }, [userLanguage]);

  const askPrice = useCallback((suggestedPrice) => {
    const question = {
      fr: `💰 Quel est le prix unitaire en TND ? (suggestion: ${suggestedPrice} TND)`,
      en: `💰 What is the unit price in TND? (suggestion: ${suggestedPrice} TND)`,
      ar: `💰 شنوّة السعر بالدينار؟ (اقتراح: ${suggestedPrice} TND)`
    }[userLanguage] || `💰 Quel est le prix unitaire en TND ? (suggestion: ${suggestedPrice} TND)`;
    addMessage('ai', question);
  }, [userLanguage]);

  const askStock = useCallback((suggestedStock) => {
    const question = {
      fr: `📦 Quelle est la quantité en stock ? (suggestion: ${suggestedStock} unités)`,
      en: `📦 What is the available stock? (suggestion: ${suggestedStock} units)`,
      ar: `📦 شنوّة الكمية المتوفرة؟ (اقتراح: ${suggestedStock})`
    }[userLanguage] || `📦 Quelle est la quantité en stock ? (suggestion: ${suggestedStock} unités)`;
    addMessage('ai', question);
  }, [userLanguage]);

  const askImages = useCallback(() => {
    const question = {
      fr: "📸 Voulez-vous ajouter des images du produit ? (max 5)",
      en: "📸 Would you like to add product images? (max 5)",
      ar: "📸 تحب تزيد صور للمنتج؟ (أقصى 5)"
    }[userLanguage] || "📸 Voulez-vous ajouter des images du produit ? (max 5)";
    addMessage('ai', question, [
      { label: { fr: "Oui", en: "Yes", ar: "نعم" }[userLanguage] || "Oui", value: "yes" },
      { label: { fr: "Non", en: "No", ar: "لا" }[userLanguage] || "Non", value: "no" }
    ]);
    setShowImageButtons(true);
  }, [userLanguage]);

  const askPdf = useCallback(() => {
    const question = {
      fr: "📄 Voulez-vous ajouter une fiche technique PDF ?",
      en: "📄 Would you like to add a technical sheet PDF?",
      ar: "📄 تحب تزيد فنية PDF؟"
    }[userLanguage] || "📄 Voulez-vous ajouter une fiche technique PDF ?";
    addMessage('ai', question, [
      { label: { fr: "Oui", en: "Yes", ar: "نعم" }[userLanguage] || "Oui", value: "yes" },
      { label: { fr: "Non", en: "No", ar: "لا" }[userLanguage] || "Non", value: "no" }
    ]);
    setShowPdfButtons(true);
  }, [userLanguage]);

  const completeAndSubmit = useCallback(async (imagesToSubmit = null, pdfToSubmit = null) => {
    setIsSubmitting(true);
    
    let finalCategoryId = null;
    let finalNewCategory = null;

    if (answers.categoryId) {
      finalCategoryId = answers.categoryId;
    } else if (answers.categoryName) {
      const existing = availableCategories.find(c => c.name.toLowerCase() === answers.categoryName.toLowerCase());
      if (existing) {
        finalCategoryId = existing._id;
      } else {
        finalNewCategory = answers.categoryName;
      }
    } else {
      finalNewCategory = "Autre";
    }

    if (!finalCategoryId && !finalNewCategory) {
      addMessage('ai', "❌ Impossible de déterminer la catégorie. Veuillez réessayer.");
      setIsSubmitting(false);
      return;
    }

    const productData = {
      name: answers.name,
      price: parseFloat(answers.price) || 0,
      stock: parseInt(answers.stock) || 0,
      description: answers.description,
      categoryId: finalCategoryId,
      newCategory: finalNewCategory,
      images: imagesToSubmit !== null ? imagesToSubmit : selectedImages,
      documentation: pdfToSubmit !== null ? [pdfToSubmit] : (selectedPdf ? [selectedPdf] : [])
    };

    addMessage('ai', "📋 Résumé du produit...\nAjout en cours...");
    try {
      await onComplete(productData);
      setIsComplete(true);
      addMessage('ai', "✅ Produit ajouté avec succès !");
      setTimeout(() => onCancel(), 2000);
    } catch (error) {
      console.error("Submit error:", error);
      addMessage('ai', `❌ Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, selectedImages, selectedPdf, availableCategories, onComplete, onCancel]);

  const processAnswer = useCallback(async (answer) => {
    addMessage('user', answer);
    const lowerAnswer = answer.toLowerCase().trim();

    if (currentStep === 0 && !answers.name) {
      if (answer.match(/[أ-ي]/)) setUserLanguage('ar');
      else if (answer.match(/[àâçéèêëîïôûùüÿñ]/i)) setUserLanguage('fr');
      else setUserLanguage('en');
    }

    // Step 0: Product name
    if (currentStep === 0) {
      setAnswers(prev => ({ ...prev, name: answer }));
      const detection = detectCategory(answer, availableCategories);
      let categoryText = "";
      let categoryId = null;
      let categoryName = null;
      
      if (detection.found) {
        categoryText = `📦 Catégorie détectée: ${detection.categoryName}`;
        categoryId = detection.categoryId;
        categoryName = detection.categoryName;
      } else if (detection.suggestedName) {
        categoryText = `📦 Nouvelle catégorie suggérée: ${detection.suggestedName} (elle sera créée automatiquement)`;
        categoryName = detection.suggestedName;
      } else {
        categoryText = `📦 Catégorie: "Autre" (sera créée automatiquement)`;
        categoryName = "Autre";
      }
      addMessage('ai', categoryText);
      setAnswers(prev => ({ ...prev, categoryId, categoryName }));
      setCurrentStep(1);
      askDescriptionChoice();
      return;
    }

    // Step 1: Description choice
    if (currentStep === 1) {
      if (lowerAnswer === 'manual') {
        setCurrentStep(2);
        askManualDescription();
      } else if (lowerAnswer === 'generate') {
        const generatedDesc = generateDescription(answers.name, answers.categoryName || 'général');
        setAnswers(prev => ({ ...prev, description: generatedDesc }));
        addMessage('ai', `📝 Description générée:\n${generatedDesc}`);
        const suggestions = suggestPriceAndStock(answers.name);
        setAnswers(prev => ({ ...prev, price: suggestions.price, stock: suggestions.stock }));
        setCurrentStep(3);
        askPrice(suggestions.price);
      }
      setShowDescriptionButtons(false);
      return;
    }

    // Step 2: Manual description
    if (currentStep === 2) {
      setAnswers(prev => ({ ...prev, description: answer }));
      const suggestions = suggestPriceAndStock(answers.name);
      setAnswers(prev => ({ ...prev, price: suggestions.price, stock: suggestions.stock }));
      setCurrentStep(3);
      askPrice(suggestions.price);
      return;
    }

    // Step 3: Price
    if (currentStep === 3) {
      let price = parseFloat(answer);
      if (isNaN(price)) {
        addMessage('ai', "Veuillez entrer un nombre valide pour le prix.");
        return;
      }
      setAnswers(prev => ({ ...prev, price }));
      const stockSuggestion = answers.stock || 50;
      setCurrentStep(4);
      askStock(stockSuggestion);
      return;
    }

    // Step 4: Stock
    if (currentStep === 4) {
      let stock = parseInt(answer);
      if (isNaN(stock)) {
        addMessage('ai', "Veuillez entrer un nombre valide pour le stock.");
        return;
      }
      setAnswers(prev => ({ ...prev, stock }));
      setCurrentStep(5);
      askImages();
      return;
    }

    // Step 5: Images
    if (currentStep === 5) {
      setShowImageButtons(false);
      if (lowerAnswer === 'yes') {
        addMessage('ai', "Veuillez sélectionner les images (max 5).");
        return;
      } else {
        setCurrentStep(6);
        askPdf();
      }
      return;
    }

    // Step 6: PDF
    if (currentStep === 6) {
      setShowPdfButtons(false);
      if (lowerAnswer === 'yes') {
        addMessage('ai', "Veuillez sélectionner le fichier PDF.");
        return;
      } else {
        await completeAndSubmit();
      }
      return;
    }
  }, [currentStep, answers, availableCategories, userLanguage, completeAndSubmit, askDescriptionChoice, askManualDescription, askPrice, askStock, askImages, askPdf]);

  // Image handling
  const addImages = useCallback((files) => {
    if (files.length > 5) { addMessage('ai', "Maximum 5 images."); return; }
    setSelectedImages(files);
    addMessage('ai', `✅ ${files.length} image(s) ajoutée(s).`);
    setCurrentStep(6);
    askPdf();
  }, [askPdf]);

  const skipImages = useCallback(() => {
    addMessage('ai', "✅ Pas d'images.");
    setCurrentStep(6);
    askPdf();
  }, [askPdf]);

  // ✅ FIXED: PDF handling - submit immediately after adding PDF
  const addPdf = useCallback((file) => {
    setSelectedPdf(file);
    addMessage('ai', `✅ Fiche technique ajoutée: ${file.name}`);
    // Submit with the PDF file directly
    completeAndSubmit(selectedImages, file);
  }, [completeAndSubmit, selectedImages]);

  const skipPdf = useCallback(() => {
    addMessage('ai', "✅ Pas de fiche technique.");
    completeAndSubmit(selectedImages, null);
  }, [completeAndSubmit, selectedImages]);

  const startConversation = useCallback(() => {
    addMessage('ai', "Bonjour ! Je vais vous aider à ajouter un nouveau produit.");
    setCurrentStep(0);
    askName();
  }, [askName]);

  const reset = useCallback(() => {
    setMessages([]);
    setAnswers({});
    setUserLanguage('fr');
    setIsComplete(false);
    setIsSubmitting(false);
    setSelectedImages([]);
    setSelectedPdf(null);
    setCurrentStep(0);
    setShowDescriptionButtons(false);
    setShowImageButtons(false);
    setShowPdfButtons(false);
  }, []);

  const handleButtonClick = useCallback((value) => {
    processAnswer(value);
  }, [processAnswer]);

  return {
    messages, currentStep, answers, userLanguage, isComplete, isSubmitting, currentField: null,
    selectedImages, selectedPdf, startConversation, processAnswer, addImages, skipImages,
    addPdf, skipPdf, confirmCategory: () => {}, reset, showDescriptionButtons, showImageButtons, showPdfButtons, handleButtonClick
  };
}