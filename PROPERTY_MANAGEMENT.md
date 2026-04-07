# Property Management Guide

## 🏠 Complete Property Management System

Your admin panel now includes full CRUD (Create, Read, Update, Delete) operations for properties with advanced features.

---

## ✨ New Features

### 1. Add New Properties
- Click **"Add Property"** button in admin panel
- Creates a new property with default values
- Automatically selects the new property for editing
- Edit all details immediately

### 2. Edit Properties
- **Basic Info**: Title, Type (Rent/Sale), Category, Status
- **Location**: Address with Google Maps preview link
- **Pricing**: Set price in Ksh
- **Property Details**:
  - For Rentals: Bedrooms, Bathrooms, Square footage
  - For Sales: Plot size, Zoning
- **Media**: Main image, additional images, virtual tour URL
- **Amenities**: Add comma-separated amenities
- **Tags**: Add searchable tags
- **Description**: Full property description

### 3. Delete Properties
- Click **"Delete"** button next to property title
- Confirmation modal prevents accidental deletion
- Property removed from database permanently

### 4. Map Integration
- Enter location as address (e.g., "Westlands, Nairobi")
- Click "Preview location on Google Maps" to verify
- Google Maps automatically geocodes the address
- Users can get directions from property detail page

### 5. Advanced Search & Filter
- Search by: Title, Location, ID, Status, Tags
- Filter by: Status (Available, Sold, Rented, etc.)
- Real-time results counter
- Combined search and filter

---

## 📋 Property Fields Reference

### Required Fields
- **ID**: Auto-generated (e.g., P1234567890)
- **Title**: Property name
- **Type**: Rent or Sale
- **Category**: Apartment, Bedsitter, Plot, House, etc.
- **Location**: Address or area name
- **Price**: Amount in Ksh
- **Status**: Available, Under Offer, Sold, Rented, Unavailable
- **Description**: Property details
- **Main Image**: Primary photo URL

### Optional Fields (Rentals)
- **Bedrooms**: Number (0 for studio)
- **Bathrooms**: Number
- **Square Footage**: Size in sqft
- **Lease Duration**: e.g., "12 Months"

### Optional Fields (Sales)
- **Plot Size**: e.g., "50x100 ft"
- **Zoning**: e.g., "Residential", "Commercial"

### Media Fields
- **Additional Images**: Comma-separated URLs
- **Virtual Tour URL**: 360° tour link
- **Video Tour URL**: YouTube, Vimeo, or uploaded video

### Enhancement Fields
- **Amenities**: WiFi, Parking, Security, Pool, etc.
- **Tags**: luxury, modern, city-view, etc.

---

## 🗺️ Map Integration Guide

### Setting Up Location

1. **Enter Address**:
   ```
   Westlands, Nairobi
   ```
   or
   ```
   123 Main Street, Karen, Nairobi
   ```

2. **Preview on Google Maps**:
   - Click the "Preview location on Google Maps" link
   - Verify the location is correct
   - Copy exact address if needed

3. **How It Works**:
   - Frontend displays Google Maps embed
   - Users can click "Get Directions"
   - Opens Google Maps with the address
   - Works on mobile and desktop

### Best Practices

✅ **DO**:
- Use specific addresses: "Westlands, Nairobi"
- Include landmarks: "Near Sarit Centre, Westlands"
- Test the preview link before saving

❌ **DON'T**:
- Use vague locations: "Nairobi"
- Use coordinates directly (not user-friendly)
- Leave location empty

---

## 🎨 Image Management

### Main Image
- Primary photo shown in listings
- Recommended size: 800x600px
- Use high-quality images
- Example: `https://picsum.photos/seed/property1/800/600`

### Additional Images
- Gallery images for property detail view
- Comma-separated URLs
- Example:
  ```
  https://image1.jpg, https://image2.jpg, https://image3.jpg
  ```

### Image Sources
- **Unsplash**: https://unsplash.com/
- **Pexels**: https://pexels.com/
- **Picsum**: https://picsum.photos/ (placeholder)
- **Your own hosting**: Upload to Cloudinary, AWS S3, etc.

---

## 🏷️ Tags & Amenities

### Tags
Purpose: Searchable keywords for filtering
Examples:
```
luxury, modern, city-view, pet-friendly, furnished
```

### Amenities
Purpose: Property features
Examples:
```
WiFi, Parking, Security, Pool, Gym, Elevator, Backup Generator
```

### Best Practices
- Use consistent naming (e.g., "WiFi" not "Wi-Fi" or "wifi")
- Add 3-8 amenities per property
- Use 2-5 tags per property
- Make them searchable and relevant

---

## 📊 Property Status Guide

### Available
- Property is ready for viewing/purchase
- Actively marketed
- Shows in search results

### Under Offer
- Offer received but not finalized
- Still visible but marked
- Prevents duplicate offers

### Sold
- Sale completed
- Archived but visible
- Shows market history

### Rented
- Rental agreement signed
- Tenant moved in
- Not available for new tenants

### Unavailable
- Temporarily off market
- Under renovation
- Hidden from main listings

---

## 🎬 Video Tours

### Supported Formats

1. **YouTube**:
   ```
   https://www.youtube.com/watch?v=VIDEO_ID
   ```

2. **Vimeo**:
   ```
   https://vimeo.com/VIDEO_ID
   ```

3. **Direct Upload**:
   - MP4, WebM, OGG
   - Max 200MB
   - Upload in admin panel

### Adding Video Tours

1. **Option A - YouTube/Vimeo**:
   - Paste URL in "Video Tour URL" field
   - Save property
   - Video auto-embeds

2. **Option B - Upload File**:
   - Click "Upload Video" section
   - Select video file
   - Click "Upload Video"
   - URL auto-populated

---

## 🔍 Search & Filter Tips

### Search Examples
- By Title: "Premium 2 Bedroom"
- By Location: "Westlands"
- By ID: "R1"
- By Tag: "luxury"
- By Status: "Available"

### Filter Combinations
- Search: "Westlands" + Filter: "Available"
- Search: "luxury" + Filter: "Under Offer"
- Search: "R" + Filter: "Rented" (all rentals)

### Results Counter
- Shows: "Filtered properties: X"
- Updates in real-time
- Helps track inventory

---

## 💡 Pro Tips

### 1. Batch Operations
- Add multiple properties at once
- Use consistent naming conventions
- Copy/paste amenities for similar properties

### 2. Quality Images
- Use professional photos
- Consistent aspect ratio (4:3 or 16:9)
- Show multiple angles
- Include exterior and interior

### 3. Detailed Descriptions
- Highlight unique features
- Mention nearby amenities
- Include transportation options
- Add contact information

### 4. Regular Updates
- Update status when offers received
- Mark properties as sold/rented promptly
- Keep prices current
- Refresh images periodically

### 5. SEO Optimization
- Use descriptive titles
- Include location in title
- Add relevant tags
- Write detailed descriptions

---

## 🚀 Workflow Example

### Adding a New Rental Property

1. **Click "Add Property"**
2. **Edit Basic Info**:
   - Title: "Modern 2BR Apartment in Westlands"
   - Type: Rent
   - Category: Apartment
   - Status: Available

3. **Set Location**:
   - Location: "Westlands, Nairobi"
   - Preview on Google Maps
   - Verify location

4. **Add Details**:
   - Price: 35000
   - Bedrooms: 2
   - Bathrooms: 2
   - Size: 850 sqft

5. **Add Media**:
   - Main Image: Upload or paste URL
   - Additional Images: 3-5 photos
   - Video Tour: Optional

6. **Add Features**:
   - Amenities: WiFi, Parking, Security, Pool
   - Tags: modern, luxury, westlands

7. **Write Description**:
   ```
   Beautiful 2-bedroom apartment in the heart of Westlands.
   Features modern finishes, spacious balcony, and 24/7 security.
   Close to Sarit Centre, restaurants, and public transport.
   ```

8. **Save Property**
9. **Preview on Frontend**
10. **Share with Clients**

---

## 📱 Mobile Optimization

All property management features work on mobile:
- ✅ Add/Edit/Delete properties
- ✅ Upload images
- ✅ Search and filter
- ✅ Map preview
- ✅ Video management

---

## 🆘 Troubleshooting

### "Property not found"
- Refresh the page
- Check if property was deleted
- Verify you're logged in as admin

### "Unable to save property"
- Check all required fields are filled
- Verify image URLs are valid
- Check internet connection

### "Map not showing"
- Verify location is a valid address
- Check Google Maps preview link
- Try more specific address

### "Video not playing"
- Check URL format
- Verify video is public
- Try different video source

---

## 📚 Additional Resources

- **Google Maps**: https://maps.google.com/
- **Image Hosting**: Cloudinary, AWS S3, Imgur
- **Video Hosting**: YouTube, Vimeo
- **Stock Photos**: Unsplash, Pexels

---

**Happy Property Managing! 🏠**
