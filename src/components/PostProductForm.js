import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader';

const PostProductForm = ({ initialValues = {}, mode = 'create', onSubmitRedirect = null }) => {
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Campos del producto
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [condition, setCondition] = useState('');
  const [photos, setPhotos] = useState([]);
  const [mainPhoto, setMainPhoto] = useState('');
  const [ownerId, setOwnerId] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState('');

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      setName(initialValues.name || '');
      setDescription(initialValues.description || '');
      setCurrency(initialValues.currency || '');
      setPrice(initialValues.price?.toString() || '');
      setQuantity(initialValues.quantity || 1);
      setCategoryId(initialValues.categoryId || '');
      setCity(initialValues.city || '');
      setCountry(initialValues.country || '');
      setCondition(initialValues.condition || '');
      setMainPhoto(initialValues.mainPhoto || '');
      setPhotos(initialValues.photos || []);
    }
  }, [initialValues, mode]);

  const countries = [
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

  const conditions = ["New", "Second-hand", "Refurbished"];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        console.error('Error retrieving the user:', authError?.message || 'User not authenticated');
        toast.error('Please log in first.');
        return;
      }

      setOwnerId(authData.user.id);
      setOwnerEmail(authData.user.email);
    };

    fetchUser();
  }, []);

  // Subida de la foto principal
  const handleMainPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `main-${Date.now()}-${file.name}`;
    const filePath = `${fileName}`;

    try {
      setUploading(true);

      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error || !data?.path) {
        throw new Error(error?.message || 'Photo upload failed.');
      }

      const { publicUrl } = supabase
        .storage
        .from('products')
        .getPublicUrl(data.path).data;

      setMainPhoto(publicUrl);
      console.log("Main photo uploaded successfully:", publicUrl);
    } catch (error) {
      console.error("Failed to upload the main photo:", error.message);
      toast.error("Failed to upload the main photo.");
    } finally {
      setUploading(false);
    }
  };

  // Enviar formulario (create o edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // UPDATE PRODUCT
    if (mode === 'edit' && initialValues.id) {
      try {
        // Filtro para que mainPhoto nunca esté en photos
        const filteredPhotos = photos.filter((url) => url && url !== mainPhoto);

        const { error } = await supabase
          .from('products')
          .update({
            name,
            description,
            price: parseFloat(price),
            currency,
            quantity: parseInt(quantity, 10),
            category_id: parseInt(categoryId, 10),
            photos: filteredPhotos,
            mainphoto: mainPhoto,
            city,
            country,
            condition,
          })
          .eq('id', initialValues.id);

        if (error) {
          toast.error('Error updating the product.');
        } else {
          toast.success('Product updated successfully');
          if (onSubmitRedirect) navigate(onSubmitRedirect);
        }
      } catch (error) {
        toast.error('Unexpected error during update.');
        console.error(error);
      }
      return;
    }

    // Validación rápida para campos requeridos
    if (!categoryId || !mainPhoto || !city || !country || !condition) {
      toast.error('Please fill in all required fields.');
      return;
    }

    console.log("Additional photos uploaded:", photos);

    // CREATE PRODUCT
    try {
      // Filtro para que mainPhoto nunca esté en photos
      const filteredPhotos = photos.filter((url) => url && url !== mainPhoto);

      const { data, error } = await supabase
        .from('products')
        .insert([{
          name,
          description,
          price: parseFloat(price),
          currency,
          quantity: parseInt(quantity, 10),
          category_id: parseInt(categoryId, 10),
          owner: ownerId,
          owneremail: ownerEmail,
          photos: filteredPhotos,
          mainphoto: mainPhoto,
          city,
          country,
          condition,
        }])
        .select('*');

      if (error) {
        console.error("Failed to save the product:", error.message);
        toast.error(`Failed to save the product: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('The product was saved successfully:', data);
        toast.success('The product was saved successfully');
        if (onSubmitRedirect) navigate(onSubmitRedirect);
        setName('');
        setDescription('');
        setPrice('');
        setQuantity(1);
        setCategoryId('');
        setPhotos([]);
        setMainPhoto('');
        setCity('');
        setCountry('');
        setCondition('');
      } else {
        toast.error('Unexpected error occurred while saving the product.');
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error.message);
      toast.error('Unexpected error occurred while saving the product.');
    }
  };

  return (
    <div className="container">
      <div className="login-form">
        <h2>{mode === 'edit' ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit}>
          <label>Product Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

          <label>Currency:</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} required>
            <option value="">Select a currency</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="AUD">AUD</option>
            <option value="GBP">GBP</option>
          </select>

          <label>Price:</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" />

          <label>Quantity:</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="1" />

          <label>Category:</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select a category</option>
            <option value="1">Deck</option>
            <option value="2">Engineering</option>
            <option value="3">Navigation</option>
            <option value="4">Galley</option>
            <option value="5">Interior</option>
            <option value="6">Others</option>
          </select>

          <label>City:</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />

          <label>Country:</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} required>
            <option value="">Select a country</option>
            {countries.map((pais, idx) => (
              <option key={idx} value={pais}>{pais}</option>
            ))}
          </select>

          <label>Condition:</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} required>
            <option value="">Select a condition</option>
            {conditions.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>

          <label>Additional photos:</label>
          <ImageUploader onUpload={(urls) => setPhotos(urls)} />

          <label>Main Photo:</label>
          {mainPhoto && (
            <div style={{ marginBottom: '10px' }}>
              <img
                src={mainPhoto}
                alt="Main"
                style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }}
              />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleMainPhotoUpload} />

          <button
            type="submit"
            className="landing-button"
            disabled={uploading}
          >
            {uploading
              ? 'Uploading photos...'
              : mode === 'edit'
                ? 'Update Product'
                : 'Save Product'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default PostProductForm;