import * as yup from 'yup';

// Esquema para validación de casos
export const caseValidationSchema = yup.object({
  case_number: yup
    .string()
    .required('El número de caso es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .matches(/^[A-Z0-9-]+$/, 'Solo se permiten letras mayúsculas, números y guiones'),
  
  description: yup
    .string()
    .required('La descripción es obligatoria')
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  
  complexity: yup
    .string()
    .oneOf(['ALTO', 'MEDIO', 'BAJO'], 'Complejidad inválida')
    .required('La complejidad es obligatoria'),
  
  status: yup
    .string()
    .oneOf(['EN CURSO', 'TERMINADA', 'ESCALADA', 'PENDIENTE'], 'Estado inválido')
    .required('El estado es obligatorio'),
  
  application_id: yup
    .string()
    .required('La aplicación es obligatoria'),
  
  origin_id: yup
    .string()
    .required('El origen es obligatorio'),
  
  priority_id: yup
    .string()
    .required('La prioridad es obligatoria'),
});

// Esquema para validación de TODOs
export const todoValidationSchema = yup.object({
  title: yup
    .string()
    .required('El título es obligatorio')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  
  description: yup
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  
  priority_id: yup
    .string()
    .required('La prioridad es obligatoria'),
  
  assigned_to: yup
    .string()
    .required('Debe asignar el TODO a un usuario'),
  
  due_date: yup
    .string()
    .nullable()
    .test('future-date', 'La fecha límite debe ser futura', function(value) {
      if (!value) return true; // opcional
      const today = new Date();
      const dueDate = new Date(value);
      return dueDate >= today;
    }),
  
  case_id: yup
    .string()
    .nullable(), // opcional
});

// Esquema para validación de usuarios
export const userValidationSchema = yup.object({
  email: yup
    .string()
    .email('Formato de email inválido')
    .required('El email es obligatorio')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  name: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  role_id: yup
    .string()
    .required('El rol es obligatorio'),
  
  password: yup
    .string()
    .when('isEditing', {
      is: false,
      then: (schema) => schema.required('La contraseña es obligatoria'),
      otherwise: (schema) => schema.notRequired(),
    })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'
    ),
});

// Esquema para validación de aplicaciones
export const applicationValidationSchema = yup.object({
  name: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  description: yup
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  
  is_active: yup
    .boolean()
    .required(),
});

// Esquema para validación de orígenes
export const originValidationSchema = yup.object({
  name: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  description: yup
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  
  is_active: yup
    .boolean()
    .required(),
});

// Esquema para validación de prioridades
export const priorityValidationSchema = yup.object({
  name: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  
  description: yup
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  
  level: yup
    .number()
    .required('El nivel es obligatorio')
    .min(1, 'El nivel mínimo es 1')
    .max(5, 'El nivel máximo es 5')
    .integer('El nivel debe ser un número entero'),
  
  color: yup
    .string()
    .required('El color es obligatorio')
    .matches(/^#[0-9A-F]{6}$/i, 'El color debe ser un código hexadecimal válido'),
  
  is_active: yup
    .boolean()
    .required(),
});

// Esquema para validación de tiempo manual
export const manualTimeValidationSchema = yup.object({
  hours: yup
    .number()
    .min(0, 'Las horas no pueden ser negativas')
    .max(24, 'Las horas no pueden exceder 24')
    .required('Las horas son obligatorias'),
  
  minutes: yup
    .number()
    .min(0, 'Los minutos no pueden ser negativos')
    .max(59, 'Los minutos no pueden exceder 59')
    .required('Los minutos son obligatorios'),
  
  date: yup
    .string()
    .required('La fecha es obligatoria')
    .test('valid-date', 'La fecha no puede ser futura', function(value) {
      if (!value) return false;
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Final del día actual
      return selectedDate <= today;
    }),
  
  description: yup
    .string()
    .required('La descripción es obligatoria')
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
});

// Esquema para login
export const loginValidationSchema = yup.object({
  email: yup
    .string()
    .email('Formato de email inválido')
    .required('El email es obligatorio'),
  
  password: yup
    .string()
    .required('La contraseña es obligatoria'),
});

// Validación personalizada para rangos de fechas
export const dateRangeValidationSchema = yup.object({
  startDate: yup
    .date()
    .required('La fecha de inicio es obligatoria'),
  
  endDate: yup
    .date()
    .required('La fecha de fin es obligatoria')
    .min(yup.ref('startDate'), 'La fecha de fin debe ser posterior a la fecha de inicio'),
});

// Funciones de utilidad para validación
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, ''); // Eliminar eventos on*=
};
