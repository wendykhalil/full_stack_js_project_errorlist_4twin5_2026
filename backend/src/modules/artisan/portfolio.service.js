const Portfolio = require('../../models/Portfolio');
const ArtisanProfile = require('../../models/ArtisanProfile');

// Ajouter un projet au portfolio
async function addPortfolioProject(artisanId, projectData, images = []) {
  try {
    // Récupérer le profil de l'artisan
    let profile = await ArtisanProfile.findOne({ userId: artisanId });
    
    // Si le profil n'existe pas, le créer automatiquement
    if (!profile) {
      console.log('⚠️ Profil artisan non trouvé, création automatique...');
      
      // Récupérer l'utilisateur pour avoir ses infos
      const User = require('../../models/User');
      const user = await User.findById(artisanId);
      
      if (!user) {
        const error = new Error('Utilisateur non trouvé');
        error.statusCode = 404;
        throw error;
      }

      // Créer un profil par défaut
      profile = new ArtisanProfile({
        userId: artisanId,
        trade: 'À définir',
        region: 'À définir',
        phone: user.phone || '',
        description: '',
        location: {
          type: 'Point',
          coordinates: [0, 0]
        }
      });

      await profile.save();
      console.log('✅ Profil artisan créé automatiquement avec ID:', profile._id);
    }

    // Créer le projet
    // Créer le projet
const project = new Portfolio({
  artisanId: profile._id,
  title: projectData.title,
  description: projectData.description,
  location: projectData.location,
  date: projectData.date,
  images: images,
  isPublic: true, // ✅ FORCER à true
  tags: projectData.tags ? projectData.tags.split(',').map(t => t.trim()) : [],
  projectLocation: projectData.coordinates ? {
    type: 'Point',
    coordinates: projectData.coordinates
  } : undefined
});

    await project.save();

    // Ajouter la référence au profil de l'artisan
    profile.portfolio.push(project._id);
    profile.totalProjects = profile.portfolio.length;
    await profile.save();

    return project;
  } catch (error) {
    console.error('Error in addPortfolioProject service:', error);
    throw error;
  }
}

// Récupérer tous les projets d'un artisan
async function getArtisanPortfolio(artisanId) {
  try {
    const profile = await ArtisanProfile.findOne({ userId: artisanId });
    if (!profile) {
      const error = new Error('Profil artisan non trouvé');
      error.statusCode = 404;
      throw error;
    }

    const projects = await Portfolio.find({ artisanId: profile._id })
      .sort({ date: -1, createdAt: -1 });

    return projects;
  } catch (error) {
    console.error('Error in getArtisanPortfolio service:', error);
    throw error;
  }
}

// Récupérer un projet spécifique
async function getProjectById(projectId, artisanId) {
  try {
    const profile = await ArtisanProfile.findOne({ userId: artisanId });
    const project = await Portfolio.findById(projectId);

    if (!project) {
      const error = new Error('Projet non trouvé');
      error.statusCode = 404;
      throw error;
    }

    // Vérifier que le projet appartient bien à l'artisan
    if (profile && project.artisanId.toString() !== profile._id.toString()) {
      const error = new Error('Non autorisé');
      error.statusCode = 403;
      throw error;
    }

    return project;
  } catch (error) {
    console.error('Error in getProjectById service:', error);
    throw error;
  }
}

// Mettre à jour un projet
async function updateProject(projectId, artisanId, projectData, images = []) {
  try {
    const profile = await ArtisanProfile.findOne({ userId: artisanId });
    const project = await Portfolio.findById(projectId);

    if (!project) {
      const error = new Error('Projet non trouvé');
      error.statusCode = 404;
      throw error;
    }

    // Vérifier que le projet appartient à l'artisan
    if (project.artisanId.toString() !== profile._id.toString()) {
      const error = new Error('Non autorisé');
      error.statusCode = 403;
      throw error;
    }

    // Mettre à jour les champs
    if (projectData.title) project.title = projectData.title;
    if (projectData.description) project.description = projectData.description;
    if (projectData.location) project.location = projectData.location;
    if (projectData.date) project.date = projectData.date;
    if (images.length > 0) project.images = images;
    if (projectData.tags) {
      project.tags = projectData.tags.split(',').map(t => t.trim());
    }

    await project.save();
    return project;
  } catch (error) {
    console.error('Error in updateProject service:', error);
    throw error;
  }
}

// Supprimer un projet
async function deleteProject(projectId, artisanId) {
  try {
    const profile = await ArtisanProfile.findOne({ userId: artisanId });
    const project = await Portfolio.findById(projectId);

    if (!project) {
      const error = new Error('Projet non trouvé');
      error.statusCode = 404;
      throw error;
    }

    // Vérifier que le projet appartient à l'artisan
    if (project.artisanId.toString() !== profile._id.toString()) {
      const error = new Error('Non autorisé');
      error.statusCode = 403;
      throw error;
    }

    await Portfolio.findByIdAndDelete(projectId);

    // Retirer la référence du profil
    profile.portfolio = profile.portfolio.filter(id => id.toString() !== projectId);
    profile.totalProjects = profile.portfolio.length;
    await profile.save();

    return { message: 'Projet supprimé avec succès' };
  } catch (error) {
    console.error('Error in deleteProject service:', error);
    throw error;
  }
}async function fixPortfolioVisibility() {
  const result = await Portfolio.updateMany(
    { isPublic: { $ne: true } },
    { $set: { isPublic: true } }
  );
  console.log(`${result.modifiedCount} projets mis à jour`);
}

fixPortfolioVisibility();

module.exports = {
  addPortfolioProject,
  getArtisanPortfolio,
  getProjectById,
  updateProject,
  deleteProject
};