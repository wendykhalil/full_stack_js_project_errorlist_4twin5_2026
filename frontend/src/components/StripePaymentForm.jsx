import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../auth/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function StripePaymentForm({ amount, plan, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError('Stripe non initialisé');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Créer l'intention de paiement
      const response = await fetch(`${API_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: amount, 
          plan: plan,
          userId: user?.id 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de création du paiement');
      }

      // 2. Confirmer le paiement avec Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        onError?.(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        // 3. Paiement réussi - Appeler l'activation
        console.log('Paiement réussi, activation en cours...');
        
        const activateResponse = await fetch(`${API_URL}/payments/activate-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            plan, 
            paymentIntentId: paymentIntent.id,
            status: 'ACTIVE'
          })
        });

        const activateData = await activateResponse.json();
        console.log('Réponse activation:', activateData);

        if (!activateResponse.ok) {
          throw new Error(activateData.error || 'Erreur lors de l\'activation');
        }

        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1e293b',
                '::placeholder': { color: '#94a3b8' },
                iconColor: '#6366f1'
              },
              invalid: {
                color: '#dc2626',
                iconColor: '#dc2626'
              }
            }
          }}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Traitement en cours...' : `Payer ${amount} €`}
      </button>
    </form>
  );
}