const { sendMail } = require('./email');

/**
 * Envoyer un email au fournisseur quand une commande est créée
 */
async function sendNewOrderEmailToSupplier(order, supplier, artisan, product) {
  try {
    const subject = '🛒 Nouvelle commande reçue';
    
    // Construire l'adresse de livraison
    const address = order.deliveryAddress 
      ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city} ${order.deliveryAddress.postalCode}`
      : 'Non spécifiée';
    
    // Calculer le prix total
    const totalPrice = order.lineTotal || (order.unitPrice * order.quantity) || 0;
    
    // Message de l'artisan (optionnel)
    const artisanMessage = order.artisanMessage || 'Aucun message';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">Nouvelle Commande</h1>
          <p style="color: #666; font-size: 16px;">Vous avez reçu une nouvelle commande d'un artisan</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Bonjour ${supplier.firstName || 'Fournisseur'},</h2>
          <p style="color: #555; font-size: 16px;">Vous avez reçu une nouvelle commande de la part d'un artisan.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 5px;">Détails de la commande</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 40%;"><strong>Numéro de commande:</strong></td>
              <td style="padding: 8px 0; color: #333;">#${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Artisan:</strong></td>
              <td style="padding: 8px 0; color: #333;">${artisan.firstName} ${artisan.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Produit:</strong></td>
              <td style="padding: 8px 0; color: #333;">${product.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Quantité:</strong></td>
              <td style="padding: 8px 0; color: #333;">${order.quantity}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Prix total:</strong></td>
              <td style="padding: 8px 0; color: #333; font-weight: bold;">${totalPrice.toFixed(2)} TND</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Adresse de livraison:</strong></td>
              <td style="padding: 8px 0; color: #333;">${address}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Message de l'artisan:</strong></td>
              <td style="padding: 8px 0; color: #333; font-style: italic;">${artisanMessage}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_BASE_URL || 'http://localhost:5173'}/fournisseur/orders/${order._id}" 
             style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Voir la commande
          </a>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Connectez-vous à votre tableau de bord pour gérer cette commande.</p>
          <p>© ${new Date().getFullYear()} BMP.tn - Tous droits réservés</p>
        </div>
      </div>
    `;

    const text = `
      NOUVELLE COMMANDE RECUE
      
      Bonjour ${supplier.firstName || 'Fournisseur'},
      
      Vous avez reçu une nouvelle commande d'un artisan.
      
      DÉTAILS DE LA COMMANDE:
      - Numéro: #${order.orderNumber}
      - Artisan: ${artisan.firstName} ${artisan.lastName}
      - Produit: ${product.name}
      - Quantité: ${order.quantity}
      - Prix total: ${totalPrice.toFixed(2)} TND
      - Adresse: ${address}
      - Message: ${artisanMessage}
      
      Connectez-vous à votre tableau de bord pour gérer cette commande.
      ${process.env.APP_BASE_URL || 'http://localhost:5173'}/fournisseur/orders/${order._id}
    `;

    await sendMail({
      to: supplier.email,
      subject,
      text,
      html
    });

    console.log(`📧 Email de nouvelle commande envoyé à ${supplier.email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email nouvelle commande:', error);
    return false;
  }
}

/**
 * Envoyer un email à l'artisan quand le statut de la commande change
 */
async function sendOrderStatusUpdateEmailToArtisan(order, artisan, supplier, product, newStatus) {
  try {
    // Traduire le statut en français
    const statusLabels = {
      'ACCEPTED': 'Acceptée',
      'PREPARING': 'En préparation',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'REFUSED': 'Refusée',
      'CANCELLED': 'Annulée'
    };

    const statusLabel = statusLabels[newStatus] || newStatus;
    const subject = `📦 Mise à jour de votre commande #${order.orderNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">Statut de commande mis à jour</h1>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Bonjour ${artisan.firstName || 'Artisan'},</h2>
          <p style="color: #555; font-size: 16px;">Le statut de votre commande a été mis à jour.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 5px;">Détails de la commande</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 40%;"><strong>Numéro de commande:</strong></td>
              <td style="padding: 8px 0; color: #333;">#${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Fournisseur:</strong></td>
              <td style="padding: 8px 0; color: #333;">${supplier.supplierProfile?.companyName || supplier.firstName + ' ' + supplier.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Produit:</strong></td>
              <td style="padding: 8px 0; color: #333;">${product.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Quantité:</strong></td>
              <td style="padding: 8px 0; color: #333;">${order.quantity}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Nouveau statut:</strong></td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; color: #4f46e5;">${statusLabel}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_BASE_URL || 'http://localhost:5173'}/artisan/orders/${order._id}" 
             style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Suivre ma commande
          </a>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Merci de votre confiance !</p>
          <p>© ${new Date().getFullYear()} BMP.tn - Tous droits réservés</p>
        </div>
      </div>
    `;

    const text = `
      MISE À JOUR DE VOTRE COMMANDE
      
      Bonjour ${artisan.firstName || 'Artisan'},
      
      Le statut de votre commande a été mis à jour.
      
      DÉTAILS DE LA COMMANDE:
      - Numéro: #${order.orderNumber}
      - Fournisseur: ${supplier.supplierProfile?.companyName || supplier.firstName + ' ' + supplier.lastName}
      - Produit: ${product.name}
      - Quantité: ${order.quantity}
      - Nouveau statut: ${statusLabel}
      
      Suivez votre commande: ${process.env.APP_BASE_URL || 'http://localhost:5173'}/artisan/orders/${order._id}
    `;

    await sendMail({
      to: artisan.email,
      subject,
      text,
      html
    });

    console.log(`📧 Email de mise à jour de statut envoyé à ${artisan.email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email mise à jour statut:', error);
    return false;
  }
}

module.exports = {
  sendNewOrderEmailToSupplier,
  sendOrderStatusUpdateEmailToArtisan
};