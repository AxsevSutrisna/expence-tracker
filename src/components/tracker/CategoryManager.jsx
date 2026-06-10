import React, { useState } from 'react';
import { Button, Input, Modal, Popover, PopoverContent, PopoverTrigger } from '../ui';
import { addCustomCategory, deleteCustomCategory } from '../../lib/categoryService';
import { TRANSACTION_TYPES } from '../../utils/constants';
import EmojiPicker from 'emoji-picker-react';

export function CategoryManager({ isOpen, onClose, user, onCategoriesUpdated, currentCategories }) {
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('💰');
  const [newType, setNewType] = useState(TRANSACTION_TYPES.EXPENSE);
  const [newColor, setNewColor] = useState('#000000');

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel || !newEmoji) return;
    
    try {
      setLoading(true);
      await addCustomCategory(user.id, {
        type: newType,
        label: newLabel,
        emoji: newEmoji,
        color: newColor
      });
      setNewLabel('');
      setNewEmoji('💰');
      await onCategoriesUpdated();
    } catch (error) {
      console.error(error);
      alert('Gagal menambahkan kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteCustomCategory(id);
      await onCategoriesUpdated();
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus kategori');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryList = (type) => {
    const customCats = (currentCategories[type] || []).filter(c => c.isCustom);
    if (customCats.length === 0) return <p className="text-sm text-secondary">Belum ada kategori kustom.</p>;

    return (
      <div className="flex flex-col gap-2 mt-2">
        {customCats.map(cat => (
          <div key={cat.id} className="flex justify-between items-center p-2 border-2 border-border rounded-md" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl" style={{ backgroundColor: `${cat.color}20`, padding: '4px', borderRadius: '4px' }}>{cat.emoji}</span>
              <span className="font-bold">{cat.label}</span>
            </div>
            <Button variant="danger" className="btn-action-small text-xs px-2 py-1" onClick={() => handleDelete(cat.id)}>
              Hapus
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Kategori Kustom">
      <div className="mb-6">
        <h3 className="font-bold mb-4 text-lg">Tambah Kategori Baru</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-6">
          <div className="form-grid-2">
            <div className="input-group">
              <label className="input-label">Tipe</label>
              <select 
                className="input-field cursor-pointer" 
                value={newType} 
                onChange={e => setNewType(e.target.value)}
              >
                <option value={TRANSACTION_TYPES.EXPENSE}>Pengeluaran</option>
                <option value={TRANSACTION_TYPES.INCOME}>Pemasukan</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Emoji</label>
              <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="input-field cursor-pointer flex items-center justify-center text-2xl h-12 w-full text-left"
                    style={{ backgroundColor: 'var(--color-surface)', border: '4px solid black' }}
                  >
                    {newEmoji}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 border-none bg-transparent shadow-none" style={{ width: 'auto' }}>
                  <EmojiPicker 
                    onEmojiClick={(emojiData) => {
                      setNewEmoji(emojiData.emoji);
                      setIsEmojiPickerOpen(false);
                    }} 
                    width={300}
                    height={400}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="input-group">
              <label className="input-label">Nama Kategori</label>
              <Input 
                value={newLabel} 
                onChange={e => setNewLabel(e.target.value)} 
                placeholder="Mis: Skincare"
                required
              />
            </div>
            <div className="input-group flex flex-col">
              <label className="input-label">Warna Label</label>
              <input 
                type="color"
                value={newColor} 
                onChange={e => setNewColor(e.target.value)} 
                className="w-full cursor-pointer rounded-md border-4 border-black"
                style={{ height: '52px', padding: 0, backgroundColor: 'var(--color-surface)' }}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="mt-4 py-3 font-bold text-lg">
            {loading ? 'Menyimpan...' : 'Tambah Kategori'}
          </Button>
        </form>
      </div>

      <div className="border-t-4 border-border pt-6">
        <h3 className="font-bold mb-3 text-lg">Kategori Pengeluaran Anda</h3>
        <div className="mb-6">
          {renderCategoryList(TRANSACTION_TYPES.EXPENSE)}
        </div>
        
        <h3 className="font-bold mb-3 text-lg">Kategori Pemasukan Anda</h3>
        <div className="mb-2">
          {renderCategoryList(TRANSACTION_TYPES.INCOME)}
        </div>
      </div>
    </Modal>
  );
}
