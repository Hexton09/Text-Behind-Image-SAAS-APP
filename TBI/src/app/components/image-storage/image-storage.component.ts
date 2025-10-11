import { Component, OnInit } from '@angular/core';
import { ImageStorageService } from '../../services/image-storage.service';

@Component({
  selector: 'app-image-storage',
  standalone: false,
  templateUrl: './image-storage.component.html',
  styleUrls: ['./image-storage.component.scss'],
})
export class ImageStorageComponent implements OnInit {
  selectedFile: File | null = null;
  imageDescription: string = '';
  images: any[] = [];
 searchTerm: string = '';
  viewingImage: any | null = null;
  isLoading: boolean = false;
  public viewMode: 'grid' | 'list' = 'grid'; // --- NEW: To manage view state, default to 'grid'

  constructor(private imageService: ImageStorageService) {}

  ngOnInit(): void {
    this.loadImages();
  }
 
  // --- NEW: Method to change the view mode ---
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  loadImages(): void {
    this.isLoading = true;
    this.imageService.getImages().subscribe(
      (data) => {
        this.images = data;
        console.log('Images loaded successfully');
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading images:', error);
        this.isLoading = false;
      }
    );
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] ?? null;
  }

  onUpload(): void {
    if (!this.selectedFile) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('description', this.imageDescription); 

    this.imageService.uploadImage(formData).subscribe(
      (response) => {
        console.log('File uploaded successfully', response);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = "";

        this.selectedFile = null;
        this.imageDescription = '';
        this.loadImages();
      },
      (error) => console.error('Error uploading file:', error)
    );
  }

 onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.loadImages();
      return;
    }
    this.imageService.searchImages(this.searchTerm).subscribe(
      (data) => {
        this.images = data;
      },
      (error) => console.error('Error searching images:', error)
    );
  }

  // --- NEW: Method to clear the search and reload all images ---
  clearSearch(): void {
    this.searchTerm = '';
    this.loadImages();
  }

  downloadImage(image: any): void {
    const link = document.createElement('a');
    link.href = image.imageData;
    link.download = image.originalName || 'download.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteImage(imageId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this image?')) {
      this.imageService.deleteImage(imageId).subscribe(
        () => {
          console.log('Image deleted successfully');
          this.images = this.images.filter(img => img._id !== imageId);
        },
        (error) => console.error('Error deleting image:', error)
      );
    }
  }

  openImageViewer(image: any): void {
    this.viewingImage = image;
  }

  closeImageViewer(): void {
    this.viewingImage = null;
  }
}