/**
 * Format numbers with Indian numbering system (K, L, Cr)
 * and round to 2 decimal places
 * 
 * @param {number} value - The number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return 'N/A';
    }

    const num = parseFloat(value);

    // Round to 2 decimal places
    const rounded = Math.round(num * 100) / 100;

    // Handle zero
    if (rounded === 0) {
        return '0.00';
    }

    const absValue = Math.abs(rounded);
    const sign = rounded < 0 ? '-' : '';

    // Crores (10,000,000)
    if (absValue >= 10000000) {
        const crores = absValue / 10000000;
        return `${sign}${crores.toFixed(2)}Cr`;
    }

    // Lakhs (100,000)
    if (absValue >= 100000) {
        const lakhs = absValue / 100000;
        return `${sign}${lakhs.toFixed(2)}L`;
    }

    // Thousands (1,000)
    if (absValue >= 1000) {
        const thousands = absValue / 1000;
        return `${sign}${thousands.toFixed(2)}K`;
    }

    // Less than 1000, return with 2 decimal places
    return rounded.toFixed(2);
};

