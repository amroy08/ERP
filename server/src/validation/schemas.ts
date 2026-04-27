import Joi from 'joi';

// UUID pattern for MySQL (36 chars with hyphens: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
const uuid = () => Joi.string().guid({ version: ['uuidv4', 'uuidv1'] });
const uuidRequired = () => uuid().required();
const uuidOptional = () => uuid().optional().allow('', null);

export const convertAdmissionSchema = Joi.object({
  admissionId: uuidOptional(),
  classId: uuid().optional().allow('', null),
  sectionId: uuidOptional(),
  rollNumber: Joi.string().allow('', null).optional(),
});

export const collectFeeSchema = Joi.object({
  studentId: uuidRequired(),
  feeStructureId: uuidOptional(),
  amountPaid: Joi.number().min(1).required(),
  paymentMode: Joi.string().valid('cash', 'cheque', 'online', 'card', 'upi').required(),
  transactionId: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
  componentsPaid: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      amount: Joi.number().min(0).required()
    })
  ).optional()
});

export const submitResultsSchema = Joi.object({
  examId: uuidRequired(),
  results: Joi.array().items(
    Joi.object({
      studentId: uuidRequired(),
      marks: Joi.array().items(
        Joi.object({
          subjectId: uuidRequired(),
          marksObtained: Joi.number().min(0).required()
        })
      ).required()
    })
  ).required()
});
