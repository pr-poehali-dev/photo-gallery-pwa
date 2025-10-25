import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Photo {
  id: number;
  url: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  exif: {
    camera: string;
    lens: string;
    iso: string;
    aperture: string;
    shutter: string;
    date: string;
  };
}

const BACKEND_URL = 'https://functions.poehali.dev/54c54fb3-5689-4a6e-b923-e50fb3e0d429';

const mockPhotos: Photo[] = [
  {
    id: 1,
    url: 'https://cdn.poehali.dev/projects/a0151bbd-86e4-4861-990a-fd3a4441d6bb/files/bd80dd4f-71dd-4704-ba40-593fcd579438.jpg',
    title: 'Горные вершины',
    location: 'Швейцарские Альпы',
    lat: 46.5547,
    lng: 7.9793,
    exif: {
      camera: 'Canon EOS R5',
      lens: 'RF 24-70mm f/2.8',
      iso: '100',
      aperture: 'f/8',
      shutter: '1/250s',
      date: '15 июня 2024'
    }
  },
  {
    id: 2,
    url: 'https://cdn.poehali.dev/projects/a0151bbd-86e4-4861-990a-fd3a4441d6bb/files/e4939cdc-645b-400e-89b8-1c8e8af8bafa.jpg',
    title: 'Ночной город',
    location: 'Токио, Япония',
    lat: 35.6762,
    lng: 139.6503,
    exif: {
      camera: 'Sony A7R IV',
      lens: 'FE 16-35mm f/2.8',
      iso: '3200',
      aperture: 'f/2.8',
      shutter: '1/60s',
      date: '22 августа 2024'
    }
  },
  {
    id: 3,
    url: 'https://cdn.poehali.dev/projects/a0151bbd-86e4-4861-990a-fd3a4441d6bb/files/149025c1-d2a6-435a-a859-858a798ee359.jpg',
    title: 'Океанский берег',
    location: 'Бали, Индонезия',
    lat: -8.3405,
    lng: 115.0920,
    exif: {
      camera: 'Nikon Z9',
      lens: 'Z 24-120mm f/4',
      iso: '200',
      aperture: 'f/11',
      shutter: '1/500s',
      date: '3 сентября 2024'
    }
  },
  {
    id: 4,
    url: 'https://cdn.poehali.dev/projects/a0151bbd-86e4-4861-990a-fd3a4441d6bb/files/bd80dd4f-71dd-4704-ba40-593fcd579438.jpg',
    title: 'Туманные вершины',
    location: 'Норвегия',
    lat: 61.4978,
    lng: 6.5310,
    exif: {
      camera: 'Canon EOS R5',
      lens: 'RF 70-200mm f/2.8',
      iso: '400',
      aperture: 'f/5.6',
      shutter: '1/320s',
      date: '10 июля 2024'
    }
  },
  {
    id: 5,
    url: 'https://cdn.poehali.dev/projects/a0151bbd-86e4-4861-990a-fd3a4441d6bb/files/e4939cdc-645b-400e-89b8-1c8e8af8bafa.jpg',
    title: 'Мегаполис',
    location: 'Нью-Йорк, США',
    lat: 40.7128,
    lng: -74.0060,
    exif: {
      camera: 'Sony A7R IV',
      lens: 'FE 24-70mm f/2.8',
      iso: '1600',
      aperture: 'f/4',
      shutter: '1/125s',
      date: '5 октября 2024'
    }
  },
  {
    id: 6,
    url: 'https://cdn.poehali.dev/projects/a0151bbd-86e4-4861-990a-fd3a4441d6bb/files/149025c1-d2a6-435a-a859-858a798ee359.jpg',
    title: 'Тропический рай',
    location: 'Мальдивы',
    lat: 3.2028,
    lng: 73.2207,
    exif: {
      camera: 'Nikon Z9',
      lens: 'Z 14-24mm f/2.8',
      iso: '64',
      aperture: 'f/8',
      shutter: '1/640s',
      date: '18 сентября 2024'
    }
  }
];

const Index = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [activeView, setActiveView] = useState<'gallery' | 'map'>('gallery');
  const [photos, setPhotos] = useState<Photo[]>(mockPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', location: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const response = await fetch(BACKEND_URL);
      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadForm.title || !uploadForm.location) {
      toast({
        title: 'Заполните все поля',
        description: 'Укажите название и место съёмки',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imageBase64 = event.target?.result as string;
          
          const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: imageBase64,
              title: uploadForm.title,
              location: uploadForm.location,
              url: imageBase64
            })
          });

          const data = await response.json();
          
          if (data.photo) {
            setPhotos([data.photo, ...photos]);
            toast({
              title: 'Фото загружено!',
              description: 'Данные EXIF успешно извлечены'
            });
            setShowUploadDialog(false);
            setUploadForm({ title: '', location: '' });
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: 'Ошибка загрузки',
            description: 'Попробуйте ещё раз',
            variant: 'destructive'
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      toast({
        title: 'Ошибка чтения файла',
        description: 'Попробуйте другое изображение',
        variant: 'destructive'
      });
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Фотопортфолио</h1>
              <p className="text-sm text-muted-foreground mt-1">Истории из путешествий по миру</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Icon name="Plus" className="mr-2" size={18} />
                Добавить фото
              </Button>
              <button
                onClick={() => setActiveView('gallery')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeView === 'gallery'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon name="Grid3x3" className="inline mr-2" size={18} />
                Галерея
              </button>
              <button
                onClick={() => setActiveView('map')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeView === 'map'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon name="Map" className="inline mr-2" size={18} />
                Карта
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {activeView === 'gallery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer bg-muted"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-semibold mb-2">{photo.title}</h3>
                    <p className="text-sm flex items-center gap-2">
                      <Icon name="MapPin" size={16} />
                      {photo.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'map' && (
          <div className="animate-fade-in">
            <div className="bg-card rounded-lg border border-border p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="Globe" size={32} className="text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">Карта путешествий</h2>
                  <p className="text-muted-foreground">Места, где были сделаны фотографии</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{photo.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <Icon name="MapPin" size={14} />
                        {photo.location}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {photo.lat.toFixed(4)}°
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {photo.lng.toFixed(4)}°
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden">
          {selectedPhoto && (
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative aspect-square bg-black">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-8 bg-card">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">{selectedPhoto.title}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon name="MapPin" size={18} />
                    <span>{selectedPhoto.location}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Координаты
                    </h3>
                    <div className="flex gap-3">
                      <Badge variant="outline" className="text-sm py-1">
                        <Icon name="Navigation" size={14} className="mr-1" />
                        {selectedPhoto.lat.toFixed(4)}°, {selectedPhoto.lng.toFixed(4)}°
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Данные EXIF
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Камера</div>
                        <div className="font-medium">{selectedPhoto.exif.camera}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Объектив</div>
                        <div className="font-medium">{selectedPhoto.exif.lens}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">ISO</div>
                        <div className="font-medium">{selectedPhoto.exif.iso}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Диафрагма</div>
                        <div className="font-medium">{selectedPhoto.exif.aperture}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Выдержка</div>
                        <div className="font-medium">{selectedPhoto.exif.shutter}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Дата съёмки</div>
                        <div className="font-medium">{selectedPhoto.exif.date}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Добавить фотографию</h2>
              <p className="text-muted-foreground text-sm">
                EXIF данные будут извлечены автоматически
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название
                </label>
                <Input
                  type="text"
                  placeholder="Например: Рассвет в горах"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Местоположение
                </label>
                <Input
                  type="text"
                  placeholder="Например: Альпы, Швейцария"
                  value={uploadForm.location}
                  onChange={(e) => setUploadForm({ ...uploadForm, location: e.target.value })}
                />
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                  variant="outline"
                >
                  {isUploading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Icon name="Upload" className="mr-2" size={18} />
                      Выбрать фото
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;