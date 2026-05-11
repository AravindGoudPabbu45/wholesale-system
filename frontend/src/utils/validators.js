/**
 * Shared validation utility for form fields.
 * Each validator returns an error message string, or '' if valid.
 */

export const V = {
    required: (val, label = 'This field') =>
        (!val || !String(val).trim()) ? `${label} is required` : '',

    minLength: (val, min, label = 'This field') =>
        val && String(val).trim().length < min ? `${label} must be at least ${min} characters` : '',

    maxLength: (val, max, label = 'This field') =>
        val && String(val).trim().length > max ? `${label} must be at most ${max} characters` : '',

    exactLength: (val, len, label = 'This field') =>
        val && String(val).trim().length !== len ? `${label} must be exactly ${len} characters` : '',

    email: (val) =>
        val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? 'Enter a valid email address' : '',

    phone: (val) =>
        val && !/^[6-9]\d{9}$/.test(String(val).replace(/[\s-]/g, '')) ? 'Enter a valid 10-digit phone number' : '',

    numeric: (val, label = 'This field') =>
        val && isNaN(Number(val)) ? `${label} must be a number` : '',

    positiveNumber: (val, label = 'This field') =>
        val && (isNaN(Number(val)) || Number(val) <= 0) ? `${label} must be a positive number` : '',

    minValue: (val, min, label = 'This field') =>
        val && Number(val) < min ? `${label} must be at least ${min}` : '',

    maxValue: (val, max, label = 'This field') =>
        val && Number(val) > max ? `${label} must be at most ${max}` : '',

    alphanumeric: (val, label = 'This field') =>
        val && !/^[a-zA-Z0-9_]+$/.test(val) ? `${label} can only contain letters, numbers, and underscores` : '',

    lettersOnly: (val, label = 'This field') =>
        val && !/^[a-zA-Z\s.'-]+$/.test(val) ? `${label} can only contain letters` : '',

    pincode: (val) =>
        val && !/^\d{6}$/.test(String(val).trim()) ? 'Pincode must be exactly 6 digits' : '',

    gst: (val) =>
        val && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/.test(String(val).trim().toUpperCase())
            ? 'Enter a valid 15-character GST number' : '',

    password: (val) => {
        if (!val) return 'Password is required';
        if (val.length < 6) return 'Password must be at least 6 characters';
        return '';
    },

    sku: (val) =>
        val && !/^[A-Z0-9][-A-Z0-9]*$/.test(String(val).trim().toUpperCase()) ? 'SKU must contain only letters, numbers, and hyphens' : '',

    noSpecialChars: (val, label = 'This field') =>
        val && /[<>{}\\]/.test(val) ? `${label} contains invalid characters` : '',
};

/**
 * Validate an entire form object against a rules map.
 * @param {Object} data - form data
 * @param {Object} rules - { fieldName: [validatorFn1, validatorFn2, ...] }
 * @returns {{ errors: Object, isValid: boolean }}
 */
export const validateForm = (data, rules) => {
    const errors = {};
    for (const [field, validators] of Object.entries(rules)) {
        for (const validator of validators) {
            const error = validator(data[field]);
            if (error) {
                errors[field] = error;
                break; // stop at first error for this field
            }
        }
    }
    return { errors, isValid: Object.keys(errors).length === 0 };
};
