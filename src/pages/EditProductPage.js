import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import { useAuth } from '../context/AuthContext';
import ImageUploader from '../components/ImageUploader';

const COUNTRIES = [
    "Albania", "Anguilla", "Antigua and Barbuda", "Argentina", "Aruba", "Australia", "Bahamas", "Bahrain", "Barbados",
    "Belgium", "Belize", "Bonaire", "Brazil", "Brunei", "Bulgaria", "BVI, UK", "Cambodia", "Canada", "Cape Verde",
    "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Curacao", "Cyprus", "Denmark", "Dominica",
    "Dominican Republic", "Ecuador", "Egypt", "Estonia", "Fiji", "Finland", "France", "Germany",
    "Greece", "Grenada", "Guatemala", "Honduras", "India", "Indonesia", "Ireland", "Israel",
    "Italy", "Jamaica", "Japan", "Kiribati", "Kuwait", "Latvia", "Libya", "Lithuania", "Madagascar",
    "Malaysia", "Maldives", "Malta", "Marshall Islands", "Mauritius", "Mexico", "Micronesia",
    "Monaco", "Montenegro", "Morocco", "Myanmar", "Netherlands", "New Zealand", "Nicaragua",
    "Norway", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Saint Kitts and Nevis",
    "Saint Lucia", "Saint Maarten", "Saint Vincent and the Grenadines", "Samoa", "Saudi Arabia", "Seychelles",
    "Singapore", "Solomon Islands", "South Africa", "South Korea", "Spain", "Sweden", "Taiwan",
    "Thailand", "Trinidad and Tobago", "Tunisia", "Turkey", "United Arab Emirates", "United Kingdom",
    "United States", "Uruguay", "Vanuatu", "Venezuela", "Vietnam"
];

const CONDITIONS = ['New', 'Second-hand', 'Refurbished'];

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: '',
    quantity: '',
    city: '',
    country: '',
    condition: '',
    mainphoto: '',
    photos: [],
  });
  const [mainFile, setMainFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error retrieving the product:', error.message);
        return;
      }

      if (data.owner !== currentUser.id) {
        alert('You do not have access to edit this product.');
        navigate('/profile');
        return;
      }

      setProduct(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        price: data.price || '',
        currency: data.currency || 'USD',
        quantity: data.quantity || '',
        city: data.city || '',
        country: data.country || '',
        condition: data.condition || '',
        mainphoto: data.mainphoto || '',
        photos: data.photos || [],
      });
      setLoading(false);
    };

    fetchProduct();
  }, [id, currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotosChange = (newPhotos) => {
    setFormData((prev) => ({
      ...prev,
      photos: newPhotos,
    }));
  };

  const handleMainPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainFile(file);
    }
  };

  const uploadMainPhoto = async () => {
    if (!mainFile) return formData.mainphoto;

    const fileName = `main-${Date.now()}-${mainFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, mainFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: mainFile.type,
      });

    if (uploadError) {
      console.error('Failed to upload the main photo:', uploadError.message);
      return formData.mainphoto;
    }

    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || formData.mainphoto;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const finalMainPhoto = await uploadMainPhoto();

    const { error } = await supabase
      .from('products')
      .update({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        city: formData.city,
        country: formData.country,
        condition: formData.condition,
        currency: formData.currency,
        mainphoto: finalMainPhoto,
        photos: formData.photos,
      })
      .eq('id', id);

    setSaving(false);

    if (error) {
      console.error('Failed to update the product:', error.message);
      alert('An error occurred while saving the changes.');
    } else {
      alert('Product updated successfully.');
      navigate('/profile');
    }
  };

  if (loading) return <p>Loading product...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Edit Product</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Product Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Currency:</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            required
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="AUD">AUD</option>
          </select>
        </div>

        <div>
          <label>Price:</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label>Quantity:</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="1"
          />
        </div>

        <div>
          <label>City:</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Country:</label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Condition:</label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            required
          >
            <option value="">Select a condition</option>
            {CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {cond}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Main Photo:</label>
          <input type="file" accept="image/*" onChange={handleMainPhotoChange} />
          {formData.mainphoto && (
            <div style={{ marginTop: '10px' }}>
              <img
                src={formData.mainphoto}
                alt="Foto principal actual"
                style={{ width: '150px', borderRadius: '8px' }}
              />
            </div>
          )}
        </div>

        <div>
          <label>Additional Photos:</label>
          <ImageUploader onUpload={handlePhotosChange} />
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default EditProductPage;