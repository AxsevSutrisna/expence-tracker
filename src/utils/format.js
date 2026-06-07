export const formatCurrency = (amount) => {
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(amount);
};
