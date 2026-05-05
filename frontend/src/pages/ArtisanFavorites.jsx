import { useCallback, useEffect, useState } from 'react';
import ReadCardButton from '../components/ReadCardButton';
import { useNavigate } from 'react-router-dom';
import { Eye, Heart, Loader2, Package, ShoppingCart, Star } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getFavorites, toggleFavorite } from '../auth/api';
import { useCart } from '../context/CartContext';
import SimpleFooter from '../components/Footer';

const fmt = (n) => Number(n ?? 0).toFixed(2);

export default function ArtisanFavorites() {
  const navigate  = useNavigate();
  const { token } = useAuth();
  const { addItem } = useCart();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getFavorites({ token });
      setProducts(res?.products || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleUnfavorite = async (productId) => {
    setProducts(prev => prev.filter(p => String(p._id) !== String(productId)));
    await toggleFavorite({ token, productId });
  };

  const handleAddToCart = async (product) => {
    setAdding(product._id);
    try { await addItem(product._id, 1); }
    finally { setAdding(null); }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 flex items-center gap-2">
            <Heart className="h-7 w-7 text-red-500 fill-red-500" /> Mes favoris
          </h1>
          <p className="mt-1 text-sm text-slate-500">{products.length} produit{products.length !== 1 ? 's' : ''} sauvegardé{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/artisan/cart')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
          <ShoppingCart className="h-4 w-4" /> Voir le panier
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
          <Heart className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">Aucun favori pour le moment</p>
          <button onClick={() => navigate('/artisan/marketplace')}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
            Parcourir le catalogue
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(product => {
            const hasRating   = product.ratingCount > 0;
            const avgRating   = hasRating ? Number(product.rating) : 0;
            const filledStars = hasRating ? Math.round(avgRating) : 0;
            const imageUrl    = product.imageUrls?.[0];

            return (
              <div key={product._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Image */}
                <div className="relative h-44 bg-slate-100">
                  {imageUrl
                    ? <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center"><Package className="h-10 w-10 text-slate-300" /></div>
                  }
                  <button onClick={() => handleUnfavorite(product._id)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:scale-110 transition-transform">
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-indigo-600 font-medium">{product.categoryId?.name}</p>
                      <h3 className="mt-1 font-semibold text-slate-900 line-clamp-2">{product.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{product.supplierId?.companyName || 'Fournisseur'}</p>
                    </div>
                    <ReadCardButton text={`${product.name}. Catégorie: ${product.categoryId?.name}. Fournisseur: ${product.supplierId?.companyName || 'Fournisseur'}. Prix: ${product.price} TND.`} />
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= filledStars ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                    ))}
                    {hasRating && <span className="ml-1 text-xs text-slate-400">({product.ratingCount})</span>}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-indigo-700">{fmt(product.price)} TND</span>
                    <span className={`text-xs font-medium ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => navigate(`/artisan/product/${product._id}`)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                      <Eye className="h-3.5 w-3.5" /> Détails
                    </button>
                    <button onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0 || adding === product._id}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      {adding === product._id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <ShoppingCart className="h-3.5 w-3.5" />
                      }
                      Panier
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SimpleFooter />
    </div>
  );
}

