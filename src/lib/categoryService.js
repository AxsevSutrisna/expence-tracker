import { supabase } from './supabase';

export const fetchCustomCategories = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
};

export const addCustomCategory = async (userId, categoryData) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{
      user_id: userId,
      type: categoryData.type,
      label: categoryData.label,
      emoji: categoryData.emoji,
      color: categoryData.color
    }])
    .select();
    
  if (error) {
    console.error('Error adding category:', error);
    throw error;
  }
  return data[0];
};

export const deleteCustomCategory = async (categoryId) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);
    
  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
  return true;
};
