const portfolioService = require('./portfolio.service');
const apiResponse = require('../../utils/apiResponse');
const Portfolio = require('../../models/Portfolio'); // ← AJOUTER CETTE LIGNE
const { uploadBufferToCloudinary } = require('../../config/cloudinary');

async function uploadPortfolioImages(files = []) {
  const uploaded = [];
  for (const file of files) {
    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: 'bmp/portfolio/images',
      resourceType: 'image',
    });
    uploaded.push(result.secure_url);
  }
  return uploaded;
}

// Ajouter un projet
async function addProject(req, res) {
  try {
    console.log('Adding portfolio project for user:', req.user._id);
    console.log('Project data:', req.body);

    // Récupérer les images uploadées
    const images = await uploadPortfolioImages(req.files || []);

    const project = await portfolioService.addPortfolioProject(
      req.user._id,
      req.body,
      images
    );

    const response = {
      success: true,
      message: 'Projet ajouté avec succès',
      data: project
    };

    // Add trial information if this was a trial attempt
    if (req.isTrialAttempt) {
      response.trialInfo = {
        isTrialAttempt: true,
        message: 'Ceci est votre essai gratuit pour créer des portfolios. Vous devez vous abonner pour en créer d\'autres.',
      };
    }

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error adding portfolio project:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors de l\'ajout du projet'
    });
  }
}

// Récupérer tous les projets de l'artisan connecté
async function getMyPortfolio(req, res) {
  try {
    const projects = await portfolioService.getArtisanPortfolio(req.user._id);
    return apiResponse(res, 'Portfolio récupéré', projects);
  } catch (error) {
    console.error('Error getting portfolio:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du chargement du portfolio'
    });
  }
}

// Récupérer les projets publics d'un artisan
async function getPublicPortfolio(req, res) {
  try {
    const { artisanId } = req.params;
    
    // ✅ Maintenant Portfolio est importé
    const projects = await Portfolio.find({ 
      artisanId,
      isPublic: true 
    }).sort({ date: -1 });

    return apiResponse(res, 'Portfolio récupéré', projects);
  } catch (error) {
    console.error('Error getting public portfolio:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du chargement du portfolio'
    });
  }
}

// Récupérer un projet spécifique
async function getProject(req, res) {
  try {
    const { id } = req.params;
    const project = await portfolioService.getProjectById(id, req.user._id);
    return apiResponse(res, 'Projet récupéré', project);
  } catch (error) {
    console.error('Error getting project:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du chargement du projet'
    });
  }
}

// Mettre à jour un projet
async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const images = await uploadPortfolioImages(req.files || []);

    const project = await portfolioService.updateProject(
      id,
      req.user._id,
      req.body,
      images
    );

    return apiResponse(res, 'Projet mis à jour', project);
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors de la mise à jour du projet'
    });
  }
}

// Supprimer un projet
async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const result = await portfolioService.deleteProject(id, req.user._id);
    return apiResponse(res, result.message);
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors de la suppression du projet'
    });
  }
}

module.exports = {
  addProject,
  getMyPortfolio,
  getPublicPortfolio,
  getProject,
  updateProject,
  deleteProject
};