import React, { useEffect, useState, useRef } from 'react';
import type { Product } from '../api';
import { api } from '../api';

interface ProductModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialProduct: Product | null;
  onClose: () => void;
  onSubmit: (product: Product | Omit<Product, 'id'>) => void;
}

export default function ProductModal({
  open,
  mode,
  initialProduct,
  onClose,
  onSubmit,
}: ProductModalProps) {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialProduct?.name ?? '');
    setCategory(initialProduct?.category ?? '');
    setDescription(initialProduct?.description ?? '');
    setPrice(initialProduct?.price != null ? String(initialProduct.price) : '');
    setStock(initialProduct?.stock != null ? String(initialProduct.stock) : '');
    setPhoto(initialProduct?.photo ?? '');
    setPhotoFile(null);
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === 'edit' ? 'Edit Product' : 'Create Product';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDesc = description.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!trimmedName || !trimmedCategory || !trimmedDesc) {
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      return;
    }

    let photoUrl = photo;

    if (photoFile) {
      try {
        setUploading(true);
        const uploadResult = await api.uploadPhoto(photoFile);
        photoUrl = uploadResult.url;
      } catch (error) {
        console.error('Upload error:', error);
        setUploading(false);
        return;
      }
    }

    const productData = {
      ...(mode === 'edit' && initialProduct?.id
        ? { id: initialProduct.id }
        : {}),
      name: trimmedName,
      category: trimmedCategory,
      description: trimmedDesc,
      price: parsedPrice,
      stock: parsedStock,
      photo: photoUrl,
    };

    onSubmit(productData);
    setUploading(false);
  };

  return (
    <div className='backdrop' onMouseDown={onClose}>
      <div
        className='modal'
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
      >
        <div className='modal__header'>
          <div className='modal__title'>{title}</div>
          <button className='iconBtn' onClick={onClose} aria-label='Close'>
            ✕
          </button>
        </div>
        <form className='form' onSubmit={handleSubmit}>
          <label className='label photo-label'>
            {photo ? (
              <img src={photo} alt='Preview' className='photo-preview-img' />
            ) : (
              <div className='photo-placeholder'>Click to select photo</div>
            )}
            <input
              type='file'
              ref={fileInputRef}
              onChange={handleFileChange}
              accept='image/*'
              className='input-file'
            />
          </label>

          <label className='label'>
            Name
            <input
              className='input'
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              autoFocus
              type='text'
              placeholder='e.g., Summer Dress'
            />
          </label>
          <label className='label'>
            Category
            <input
              className='input'
              value={category}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCategory(e.target.value)
              }
              type='text'
              placeholder='e.g., Dresses'
            />
          </label>
          <label className='label'>
            Description
            <textarea
              className='input'
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              rows={3}
              placeholder='Product description...'
            />
          </label>
          <label className='label'>
            Price ($)
            <input
              className='input'
              value={price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPrice(e.target.value)
              }
              inputMode='numeric'
              type='number'
              min='0'
              step='0.01'
              placeholder='0.00'
            />
          </label>
          <label className='label'>
            Stock Quantity
            <input
              className='input'
              value={stock}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStock(e.target.value)
              }
              inputMode='numeric'
              type='number'
              min='0'
              step='1'
              placeholder='0'
            />
          </label>
          <div className='modal__footer'>
            <button type='button' className='btn' onClick={onClose}>
              Cancel
            </button>
            <button
              type='submit'
              className='btn btn--primary'
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : mode === 'edit' ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
