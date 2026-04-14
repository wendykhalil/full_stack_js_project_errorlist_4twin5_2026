function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: 'Non autorisé' });
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    return next();
  };
}

module.exports = { requireRoles };
