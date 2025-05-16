import supabase from '../supabase';

export async function confirmPurchase(purchaseId) {
  const { error } = await supabase
    .from('purchases')
    .update({
      buyer_confirmed: true,
      status: 'completed',
    })
    .eq('id', purchaseId);

  if (error) console.error('Error al confirmar compra:', error.message);
}

export async function reportProblem(purchaseId) {
  const { error } = await supabase
    .from('purchases')
    .update({ status: 'problem_reported' })
    .eq('id', purchaseId);

  if (error) console.error('Error al reportar problema:', error.message);
}

export async function cancelPurchase(purchaseId) {
  const { error } = await supabase
    .from('purchases')
    .update({ status: 'cancelled' })
    .eq('id', purchaseId);

  if (error) console.error('Error al cancelar compra:', error.message);
}