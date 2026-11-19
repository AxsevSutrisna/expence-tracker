import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Button, Input, Select, Modal, Popover, PopoverContent, PopoverTrigger, ConfirmDeleteButton, ListRow } from '@shared/ui';
import { addCustomCategory, deleteCustomCategory } from '../services/categoryService';
import { useAsyncAction } from '@shared/hooks/useAsyncAction';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import type { CategoryMap, TransactionType } from '@shared/types';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';

const TYPE_OPTIONS = [
  { value: TRANSACTION_TYPES.EXPENSE, label: 'Pengeluaran' },
  { value: TRANSACTION_TYPES.INCOME, label: 'Pemasukan' },
];

export interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onCategoriesUpdated: () => Promise<void> | void;
  currentCategories: CategoryMap;
}

export function CategoryManager({
  isOpen,
  onClose,
  user,
  onCategoriesUpdated,
  currentCategories,
}: CategoryManagerProps) {
  const { loading, run } = useAsyncAction();
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('💰');
  const [newType, setNewType] = useState<TransactionType>(TRANSACTION_TYPES.EXPENSE);
  const [newColor, setNewColor] = useState('#000000');

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newLabel || !newEmoji) return;
    run(async () => {
      await addCustomCategory(user.id, {
        type: newType,
        label: newLabel,
        emoji: newEmoji,
        color: newColor,
      });
      setNewLabel('');
      setNewEmoji('💰');
      await onCategoriesUpdated();
    }, 'Gagal menambahkan kategori');
  };

  const handleDelete = (id: string) => {
    run(async () => {
      await deleteCustomCategory(id);
      await onCategoriesUpdated();
    }, 'Gagal menghapus kategori');
  };

  const renderCategoryList = (type: TransactionType) => {
    const customCats = (currentCategories[type] || []).filter((c) => c.isCustom);
    if (customCats.length === 0) return <p className="text-sm text-secondary">Belum ada kategori kustom.</p>;

    return (
      <div className="flex flex-col gap-2 mt-2">
        {customCats.map((cat) => (
          <ListRow key={cat.id} style={{ padding: '0.5rem' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl" style={{ backgroundColor: `${cat.color}20`, padding: '4px', borderRadius: '4px' }}>{cat.emoji}</span>
              <span className="font-bold">{cat.label}</span>
            </div>
            <ConfirmDeleteButton
              className="btn-action-small text-xs px-2 py-1"
              onConfirm={() => handleDelete(cat.id)}
              title="Hapus Kategori?"
              description="Kategori kustom ini akan dihapus."
            />
          </ListRow>
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
            <Select
              label="Tipe"
              value={newType}
              onChange={(e) => setNewType(e.target.value as TransactionType)}
              options={TYPE_OPTIONS}
            />
            <div className="input-group">
              <label className="input-label">Emoji</label>
              <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="input-field cursor-pointer flex items-center justify-center text-2xl h-12 w-full text-left"
                    style={{ backgroundColor: 'var(--color-surface)' }}
                  >
                    {newEmoji}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 border-none bg-transparent shadow-none" style={{ width: 'auto' }}>
                  <EmojiPicker
                    onEmojiClick={(emojiData: EmojiClickData) => {
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
            <Input
              label="Nama Kategori"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Mis: Skincare"
              required
            />
            <div className="input-group flex flex-col">
              <label className="input-label">Warna Label</label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-full cursor-pointer rounded-md border-4"
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
