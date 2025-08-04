document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const inputTypeSelect = document.getElementById('inputType');
    const dimensionInputsDiv = document.getElementById('dimensionInputs');
    const areaInputDiv = document.getElementById('areaInput');
    const lengthInput = document.getElementById('length');
    const widthInput = document.getElementById('width');
    const areaValueInput = document.getElementById('areaValue');
    const inputUnitSelect = document.getElementById('inputUnit');
    const calculateBtn = document.querySelector('.calculate-btn');
    const resultsDiv = document.getElementById('results');
    const primaryResultValue = document.querySelector('#primaryResult .result-value');
    const conversionsDiv = document.getElementById('conversions');
    const mapSection = document.getElementById('mapSection');

    // --- Map Elements ---
    const mapContainer = document.getElementById('mapContainer');
    const floorPlan = document.getElementById('floorPlan');
    const lengthLabel = document.getElementById('lengthLabel');
    const widthLabel = document.getElementById('widthLabel');
    const areaText = document.getElementById('areaText');

    // --- State Variables ---
    let currentScale = 1;
    let currentLengthFt = 0;
    let currentWidthFt = 0;

    // --- Conversion Factors (to Square Feet) ---
    const CONVERSION_FACTORS = {
        ft: 1, m: 3.28084, yd: 3, // Linear
        sqft: 1, sqm: 10.7639, sqyd: 9, guz: 9, acre: 43560, hectare: 107639.1 // Area
    };

    const UNIT_LABELS = {
        sqft: 'sq ft', sqm: 'sq m', sqyd: 'sq yd', guz: 'guz', acre: 'acres', hectare: 'hectares'
    };
    
    // --- Event Listeners ---
    inputTypeSelect.addEventListener('change', toggleInputMode);
    calculateBtn.addEventListener('click', handleCalculation);
    document.getElementById('zoomIn').addEventListener('click', () => adjustScale(0.1));
    document.getElementById('zoomOut').addEventListener('click', () => adjustScale(-0.1));
    document.getElementById('resetZoom').addEventListener('click', resetScale);
    lengthInput.addEventListener('input', parseDimensionInput);
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateBtn.click();
    });

    // --- Functions ---
    function toggleInputMode() {
        if (inputTypeSelect.value === 'dimensions') {
            dimensionInputsDiv.style.display = 'block';
            areaInputDiv.style.display = 'none';
        } else {
            dimensionInputsDiv.style.display = 'none';
            areaInputDiv.style.display = 'block';
        }
    }

    function parseDimensionInput(e) {
        const value = e.target.value;
        if (value.includes('x') || value.includes('×')) {
            const parts = value.split(/[x×]/);
            if (parts.length === 2) {
                lengthInput.value = parts[0].trim();
                widthInput.value = parts[1].trim();
            }
        }
    }
    
    function validateInputs(type, length, width, area) {
        let isValid = true;
        document.getElementById('dimension-error').textContent = '';
        document.getElementById('area-error').textContent = '';
        
        if (type === 'dimensions') {
            if (!length || !width || length <= 0 || width <= 0) {
                document.getElementById('dimension-error').textContent = 'Please enter valid positive numbers.';
                isValid = false;
            }
        } else {
            if (!area || area <= 0) {
                document.getElementById('area-error').textContent = 'Please enter a valid positive area.';
                isValid = false;
            }
        }
        return isValid;
    }

    function handleCalculation() {
        const inputType = inputTypeSelect.value;
        const inputUnit = inputUnitSelect.value;
        const length = parseFloat(lengthInput.value);
        const width = parseFloat(widthInput.value);
        const areaValue = parseFloat(areaValueInput.value);

        if (!validateInputs(inputType, length, width, areaValue)) return;
        
        let areaInSqFt = 0;
        let calculationText = '';

        if (inputType === 'dimensions') {
            const lengthInFt = length * (CONVERSION_FACTORS[inputUnit] || 1);
            const widthInFt = width * (CONVERSION_FACTORS[inputUnit] || 1);
            areaInSqFt = lengthInFt * widthInFt;
            currentLengthFt = lengthInFt;
            currentWidthFt = widthInFt;
            calculationText = `${length} × ${width} ${inputUnit} = ${areaInSqFt.toLocaleString(undefined, {maximumFractionDigits: 2})} sq ft`;
        } else {
            areaInSqFt = areaValue * (CONVERSION_FACTORS[inputUnit] || 1);
            // For visualization, assume a square plot
            currentLengthFt = Math.sqrt(areaInSqFt);
            currentWidthFt = Math.sqrt(areaInSqFt);
            calculationText = `${areaValue.toLocaleString()} ${UNIT_LABELS[inputUnit] || inputUnit} = ${areaInSqFt.toLocaleString(undefined, {maximumFractionDigits: 2})} sq ft`;
        }
        
        displayResults(calculationText, areaInSqFt);
        updateMapVisualization();
    }

    function displayResults(calculationText, areaInSqFt) {
        primaryResultValue.textContent = calculationText;
        
        const conversions = [
            { unit: 'sqft', label: 'Square Feet', value: areaInSqFt },
            { unit: 'sqm', label: 'Square Meters', value: areaInSqFt / CONVERSION_FACTORS.sqm },
            { unit: 'sqyd', label: 'Square Yards', value: areaInSqFt / CONVERSION_FACTORS.sqyd },
            { unit: 'guz', label: 'Guz', value: areaInSqFt / CONVERSION_FACTORS.guz },
            { unit: 'acre', label: 'Acres', value: areaInSqFt / CONVERSION_FACTORS.acre },
            { unit: 'hectare', label: 'Hectares', value: areaInSqFt / CONVERSION_FACTORS.hectare }
        ];

        conversionsDiv.innerHTML = '';
        conversions.forEach(conv => {
            const formattedValue = conv.value >= 1 ?
                conv.value.toLocaleString(undefined, { maximumFractionDigits: 4 }) :
                conv.value.toPrecision(4);
            
            const valueWithUnit = `${formattedValue} ${UNIT_LABELS[conv.unit]}`;
            
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <span class="result-label">${conv.label}:</span>
                <span class="result-value">${valueWithUnit}</span>
                <button class="copy-btn" data-clipboard-text="${valueWithUnit}">Copy</button>
            `;
            conversionsDiv.appendChild(resultItem);
        });

        // Add event listeners to new copy buttons
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', handleCopy);
        });

        resultsDiv.classList.add('show');
        mapSection.classList.add('show');
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function handleCopy(e) {
        const button = e.target;
        const textToCopy = button.getAttribute('data-clipboard-text');
        navigator.clipboard.writeText(textToCopy).then(() => {
            button.textContent = 'Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = 'Copy';
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    function updateMapVisualization() {
        const containerWidth = mapContainer.clientWidth - 80; 
        const containerHeight = mapContainer.clientHeight - 80;

        if (currentLengthFt <= 0 || currentWidthFt <= 0) return;

        const scaleX = containerWidth / currentLengthFt;
        const scaleY = containerHeight / currentWidthFt;
        const autoScale = Math.min(scaleX, scaleY);
        
        const finalScale = autoScale * currentScale;

        const rectWidth = currentLengthFt * finalScale;
        const rectHeight = currentWidthFt * finalScale;

        floorPlan.style.width = `${rectWidth}px`;
        floorPlan.style.height = `${rectHeight}px`;
        floorPlan.style.left = `${(mapContainer.clientWidth - rectWidth) / 2}px`;
        floorPlan.style.top = `${(mapContainer.clientHeight - rectHeight) / 2}px`;

        lengthLabel.textContent = `${currentLengthFt.toFixed(1)} ft`;
        widthLabel.textContent = `${currentWidthFt.toFixed(1)} ft`;
        
        const totalArea = currentLengthFt * currentWidthFt;
        areaText.textContent = (rectWidth > 80 && rectHeight > 40) ? `${totalArea.toFixed(0)} sq ft` : '';

        // Update info panel
        document.getElementById('displayLength').textContent = `${currentLengthFt.toLocaleString(undefined, {maximumFractionDigits: 2})} ft`;
        document.getElementById('displayWidth').textContent = `${currentWidthFt.toLocaleString(undefined, {maximumFractionDigits: 2})} ft`;
        document.getElementById('displayArea').textContent = `${totalArea.toLocaleString(undefined, {maximumFractionDigits: 2})} sq ft`;
        const perimeter = 2 * (currentLengthFt + currentWidthFt);
        document.getElementById('displayPerimeter').textContent = `${perimeter.toLocaleString(undefined, {maximumFractionDigits: 2})} ft`;
    }

    function adjustScale(delta) {
        currentScale = Math.max(0.2, Math.min(5, currentScale + delta));
        updateMapVisualization();
    }

    function resetScale() {
        currentScale = 1;
        updateMapVisualization();
    }
});