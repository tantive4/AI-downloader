function filenameFromAlt(alt, prefix = '') {
    // pull out day, month, year, hour
    const re = /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\s+(\d{1,2})\s+UTC/i
    const m = alt.match(re)
    if (!m) throw new Error(`Invalid ALT text: ${alt}`)
    const [ , D, Mstr, Y, H] = m

    // map to numeric month
    const monthMap = {
        "JAN": '01', "FEB": '02', "MAR": '03', "APR": '04',
        "MAY": '05', "JUN": '06', "JUL": '07', "AUG": '08',
        "SEP": '09', "OCT": '10', "NOV": '11', "DEC": '12'
    }
    const M = monthMap[Mstr.toUpperCase()]
    if (!M) throw new Error(`Invalid month in ALT text: ${Mstr}`)

    // build UTC timestamp & shift to KST
    const utcMs = Date.UTC(+Y, +M - 1, +D, +H)
    const kst = new Date(utcMs + 9 * 60 * 60 * 1000) // KST = UTC+9

    // format MMDDHH (all zero-padded)
    const MM = String(kst.getMonth() + 1).padStart(2, '0')
    const DD = String(kst.getDate()).padStart(2, '0')
    const HH = String(kst.getHours()).padStart(2, '0')

    // Prepend the prefix if it exists, and ensure it ends with a space or underscore for readability
    const formattedPrefix = prefix ? `${prefix}_` : '';
    return `${formattedPrefix}${MM}${DD}${HH}.png` // Return with .png extension
}

// Main Function
(async () => {
    const images = document.querySelectorAll('body img[alt*="UTC"]');

    if (images.length === 0) {
        console.log("No images with 'UTC' in alt text found.");
        return;
    }

    // Get dimensions from the first image
    const firstImg = images[0];
    let imgWidth, imgHeight;

    try {
        const response = await fetch(firstImg.src);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        imgWidth = imageBitmap.width;
        imgHeight = imageBitmap.height;
    } catch (error) {
        console.error('Error getting dimensions from first image:', error);
        return;
    }

    // --- New code to extract prefix from <p> tag ---
    let filenamePrefix = '';
    const pElement = document.querySelector('body main p'); // Target <p> inside <body><main>
    if (pElement && pElement.innerText) {
        const pText = pElement.innerText;
        const match = pText.match(/(AIFS|GraphCast)/i);
        if (match && match[1]) {
            filenamePrefix = match[1].replace(/\s/g, ''); // Remove spaces for filename
            console.log(`AI model: ${filenamePrefix}`);
        } else {
            console.log("Could not find 'AIFS' or 'GraphCast' in the first <p> tag within <main>.");
        }
    } else {
        console.log("No suitable <p> element found within <body><main> to extract prefix.");
    }
    // --- End of new code ---

    const BATCH_SIZE = 10;
    let batchCount = 0;

    for (let i = 0; i < images.length; i += BATCH_SIZE) {
        batchCount++;
        const currentBatch = Array.from(images).slice(i, i + BATCH_SIZE);

        if (currentBatch.length === 0) {
            continue; // Skip if batch is empty
        }

        const batchFirstImg = currentBatch[0];
        const batchWidth = imgWidth * currentBatch.length;
        const batchHeight = imgHeight;

        // Create a new canvas for the current batch
        const batchCanvas = document.createElement('canvas');
        batchCanvas.width = batchWidth;
        batchCanvas.height = batchHeight;
        const ctx = batchCanvas.getContext('2d');

        let currentXOffset = 0;

        // Draw each image in the current batch onto its canvas
        for (const img of currentBatch) {
            try {
                const response = await fetch(img.src);
                const blob = await response.blob();
                const imageBitmap = await createImageBitmap(blob);

                ctx.drawImage(imageBitmap, currentXOffset, 0, imgWidth, imgHeight);
                currentXOffset += imgWidth;
            } catch (error) {
                console.error(`Error processing image ${img.src} for Batch ${batchCount}:`, error);
            }
        }

        // Convert the batch canvas to PNG blob
        const pngBlob = await new Promise((resolve, reject) => {
            batchCanvas.toBlob(resolve, 'image/png');
            setTimeout(() => reject(new Error(`Timeout converting batch canvas to PNG for Batch ${batchCount}`)), 15000); // Increased timeout for safety
        });

        // Generate filename based on the first image of the batch, now with the extracted prefix
        const finalFilename = filenameFromAlt(batchFirstImg.alt, filenamePrefix);

        // Trigger download for the current batch
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        console.log(`Successfully downloaded batch image: ${finalFilename}`);

        // Small delay between batch downloads to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    alert('쿨쿨ZZZ')

})
();
