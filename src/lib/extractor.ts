export type ReceiptItem = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  participants: string[];
};

export interface ReceiptItemExtractor {
  extract(image: File): Promise<ReceiptItem[]>;
}

// V1 Stub Implementation
export class ManualExtractor implements ReceiptItemExtractor {
  async extract(_image: File): Promise<ReceiptItem[]> {
    // For V1, we return an empty array or a single dummy item 
    // to allow the user to manually enter the items via the UI.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 800); // Simulate network delay
    });
  }
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((reader.result as string).split(',')[1]);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality to ensure small payload
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = () => resolve((reader.result as string).split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

export class GeminiExtractor implements ReceiptItemExtractor {
  async extract(image: File): Promise<ReceiptItem[]> {
    try {
      const base64Data = await fileToBase64(image);
      const mimeType = image.type;

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Data, mimeType })
      });

      if (!response.ok) {
        console.error("Backend extraction failed");
        return [];
      }

      const data = await response.json();
      const rawItems = data.items || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rawItems.map((item: any) => ({
        id: crypto.randomUUID(),
        name: item.name || "Unknown Item",
        unitPrice: parseFloat(item.unitPrice) || 0,
        quantity: parseInt(item.quantity) || 1,
        participants: [] // Users will select participants in UI
      }));

    } catch (err) {
      console.error("Failed to parse receipt", err);
      return [];
    }
  }
}
