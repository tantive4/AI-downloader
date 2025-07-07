function filenameFromAlt(alt) {

    // pull out day, month, year, hour
    const re = /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\s+(\d{1,2})\s+UTC/i
    const m = alt.match(re)
    if (!m) throw new Error('Invalid ALT text: ${alt}')
    const [ , D, Mstr, Y, H] = m

    // map to numeric month
    const monthMap = {
        "JAN": '01', "FEB": '02', "MAR": '03', "APR": '04',
        "MAY": '05', "JUN": '06', "JUL": '07', "AUG": '08',
        "SEP": '09', "OCT": '10', "NOV": '11', "DEC": '12'
    }
    const M = monthMap[Mstr.toUpperCase()]
    if (!M) throw new Error('Invalid month in ALT text: ${Mstr}')

    // build UTC timestamp & shift to KST
    const utcMs = Date.UTC(+Y, +M - 1, +D, +H)
    const kst = new Date(utcMs + 9 * 60 * 60 * 1000) // KST = UTC+9

    // format MMDDHH (all zero-padded)
    const MM = String(kst.getMonth() + 1).padStart(2, '0')
    const DD = String(kst.getDate()).padStart(2, '0')
    const HH = String(kst.getHours()).padStart(2, '0')

    return `${MM}${DD}${HH}.png`
}

async function downloadImage(img) {
    try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);

        const canvas = document.createElement('canvas');
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageBitmap, 0, 0);

        const pngBlob = await new Promise((resolve, reject) => {
            canvas.toBlob(resolve, 'image/png')
            setTimeout(() => reject(new Error('Timeout converting to PNG')), 5000)
        })

        const filename = filenameFromAlt(img.alt);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        console.log(filename)
        
    }
    catch (error) {
        console.error('Error downloading image:', error);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImageWithDelay(img) {
    await downloadImage(img)
    await delay(100)
}

// Main Function
(async () => {
    const images = document.querySelectorAll('body img[alt*="UTC"]');
    for (const img of images) {
        await downloadImageWithDelay(img);
    }
    alert("쿨쿨ZZZ")
}
)()