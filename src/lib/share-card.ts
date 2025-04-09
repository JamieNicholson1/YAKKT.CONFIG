export const generateShareCard = async (
  buildName: string,
  authorName: string,
  chassisName: string,
  optionsList: string[],
  screenshotUrl: string | null
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const width = 1200;
      const height = 630;
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Failed to create canvas context');
        return;
      }
      
      // Helper function to complete drawing and resolve with image data
      const finalizeCard = () => {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (err) {
          console.error('Error converting canvas to data URL:', err);
          createFallbackCard(ctx);
        }
      };
      
      // Create a simple fallback card with just text content
      const createFallbackCard = (context: CanvasRenderingContext2D) => {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, width, height);
        
        context.fillStyle = '#000000';
        context.font = 'bold 32px "Space Mono", monospace';
        context.textAlign = 'center';
        context.fillText('YAKKT CONFIGURATOR', width/2, 100);
        
        context.fillStyle = '#F59E0B';
        context.font = 'bold 48px "Space Mono", monospace';
        context.fillText(buildName || 'My Custom Van', width/2, 180);
        
        context.fillStyle = '#000000';
        context.font = '24px "Space Mono", monospace';
        context.fillText(`Chassis: ${chassisName}`, width/2, 250);
        
        context.fillStyle = '#4B5563';
        context.font = '20px "Space Mono", monospace';
        context.textAlign = 'center';
        
        let yPos = 320;
        const displayOptions = optionsList.length > 6 ? 
          optionsList.slice(0, 5).concat([`+ ${optionsList.length - 5} more`]) : 
          optionsList;
          
        displayOptions.forEach((option) => {
          context.fillText(`• ${option}`, width/2, yPos);
          yPos += 40;
        });
        
        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (finalErr) {
          reject('Failed to generate share image');
        }
      };
      
      // Load and draw the screenshot if available
      if (screenshotUrl) {
        const screenshot = new Image();
        screenshot.crossOrigin = 'anonymous';
        
        screenshot.onload = () => {
          try {
            drawCleanCardLayout(ctx, screenshot);
            finalizeCard();
          } catch (canvasErr) {
            console.error('Error drawing screenshot on canvas:', canvasErr);
            createFallbackCard(ctx);
          }
        };
        
        screenshot.onerror = () => {
          console.error('Failed to load screenshot');
          drawCleanCardLayout(ctx, null);
          finalizeCard();
        };
        
        try {
          screenshot.src = screenshotUrl;
        } catch (srcErr) {
          console.error('Error setting screenshot source:', srcErr);
          drawCleanCardLayout(ctx, null);
          finalizeCard();
        }
      } else {
        drawCleanCardLayout(ctx, null);
        finalizeCard();
      }
      
      // Function to draw a clean, modern card layout
      function drawCleanCardLayout(context: CanvasRenderingContext2D, image: HTMLImageElement | null) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, width, height);
        
        const imageSection = { 
          x: 40, 
          y: 40,
          width: width * 0.5 - 60, 
          height: height - 80
        };
        
        context.fillStyle = '#F9FAFB';
        context.fillRect(
          imageSection.x, 
          imageSection.y, 
          imageSection.width, 
          imageSection.height
        );
        
        if (image) {
          const imgRatio = image.width / image.height;
          let renderWidth = imageSection.width - 40;
          let renderHeight = renderWidth / imgRatio;
          
          if (renderHeight > imageSection.height - 40) {
            renderHeight = imageSection.height - 40;
            renderWidth = renderHeight * imgRatio;
          }
          
          const xOffset = imageSection.x + (imageSection.width - renderWidth) / 2;
          const yOffset = imageSection.y + (imageSection.height - renderHeight) / 2;
          
          context.drawImage(image, xOffset, yOffset, renderWidth, renderHeight);
        } else {
          context.fillStyle = '#E5E7EB';
          context.fillRect(
            imageSection.x + 40, 
            imageSection.y + imageSection.height/2 - 40, 
            imageSection.width - 80, 
            80
          );
          
          context.fillStyle = '#9CA3AF';
          context.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
          context.textAlign = 'center';
          context.fillText(
            'Van Preview', 
            imageSection.x + imageSection.width / 2, 
            imageSection.y + imageSection.height / 2 + 6
          );
        }
        
        const textX = width * 0.5 + 20;
        let currentY = 60;
        
        const titleFont = 'bold 46px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        const headerFont = 'bold 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        const normalFont = '20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        const smallFont = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        
        context.font = headerFont;
        context.fillStyle = '#111111';
        context.textAlign = 'left';
        context.fillText('YAKKT', textX, currentY);
        
        context.font = '24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        context.fillStyle = '#4B5563';
        context.fillText('CONFIGURATOR', textX + 90, currentY);
        currentY += 80;
        
        context.font = titleFont;
        context.fillStyle = '#111111';
        context.fillText(buildName || 'My Custom Van', textX, currentY);
        currentY += 30;
        
        if (authorName) {
          context.font = normalFont;
          context.fillStyle = '#6B7280';
          context.fillText(`Designed by ${authorName}`, textX, currentY);
          currentY += 60;
        } else {
          currentY += 30;
        }
        
        context.fillStyle = '#E5E7EB';
        context.fillRect(textX, currentY, width * 0.43, 1);
        currentY += 40;
        
        context.font = headerFont;
        context.fillStyle = '#111111';
        context.fillText('Chassis', textX, currentY);
        currentY += 30;
        
        context.font = normalFont;
        context.fillStyle = '#374151';
        context.fillText(chassisName, textX, currentY);
        currentY += 50;
        
        context.font = headerFont;
        context.fillStyle = '#111111';
        context.fillText('Selected Options', textX, currentY);
        currentY += 30;
        
        const displayOptions = optionsList.length > 6 ? 
          [...optionsList.slice(0, 5), `+ ${optionsList.length - 5} more options`] : 
          [...optionsList];
        
        context.font = normalFont;
        displayOptions.forEach((option, index) => {
          context.fillStyle = '#D1D5DB';
          context.beginPath();
          context.arc(textX + 6, currentY - 7, 4, 0, Math.PI * 2);
          context.fill();
          
          const color = index === displayOptions.length - 1 && optionsList.length > 6 ? 
            '#F59E0B' : '#374151';
          
          context.fillStyle = color;
          context.fillText(option, textX + 20, currentY);
          currentY += 36;
        });
        
        const footerY = height - 40;
        context.font = smallFont;
        context.fillStyle = '#9CA3AF';
        context.fillText('yakkt.com', textX, footerY);
        
        context.fillStyle = '#F59E0B';
        context.beginPath();
        context.moveTo(width - 40, 40);
        context.lineTo(width - 20, 40);
        context.lineTo(width - 20, 60);
        context.fill();
      }
    } catch (error) {
      console.error('Error generating share card:', error);
      reject('Failed to generate share card');
    }
  });
}; 