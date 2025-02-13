const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['full', 'installment', 'partial_advance'],
        default: 'full'
    },
    installmentPlan: {
        totalInstallments: {
            type: Number,
            min: 1,
            max: 6
        },
        installmentAmount: {
            type: Number
        },
        paidInstallments: {
            type: Number,
            default: 0
        },
        nextPaymentDate: {
            type: Date
        }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'completed', 'overdue'],
        default: 'pending'
    },
    transactions: [{
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['success', 'failed', 'pending'],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']
        }
    }],
    refundDetails: {
        refundAmount: {
            type: Number,
            default: 0
        },
        refundStatus: {
            type: String,
            enum: ['pending', 'processed', 'rejected'],
            default: null
        },
        refundReason: {
            type: String
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for remaining balance
paymentSchema.virtual('remainingBalance').get(function() {
    if (this.paymentMethod === 'full') return 0;
    
    const paidAmount = this.transactions
        .filter(t => t.status === 'success')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    
    return this.totalAmount - paidAmount;
});

// Method to create installment plan
paymentSchema.methods.createInstallmentPlan = function(installments = 3) {
    if (this.paymentMethod !== 'installment') {
        throw new Error('Installment plan can only be created for installment payment method');
    }

    const installmentAmount = Math.round(this.totalAmount / installments);
    const firstInstallmentDate = new Date();
    firstInstallmentDate.setMonth(firstInstallmentDate.getMonth() + 1);

    this.installmentPlan = {
        totalInstallments: installments,
        installmentAmount,
        paidInstallments: 0,
        nextPaymentDate: firstInstallmentDate
    };

    return this;
};

// Method to process payment
paymentSchema.methods.processPayment = function(amount, method) {
    // Validate payment amount
    if (amount > this.remainingBalance) {
        throw new Error('Payment amount exceeds remaining balance');
    }

    const transaction = {
        amount,
        date: new Date(),
        status: 'success',
        paymentMethod: method
    };

    this.transactions.push(transaction);

    // Update installment details if applicable
    if (this.paymentMethod === 'installment') {
        this.installmentPlan.paidInstallments++;
        
        // Update next payment date
        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        this.installmentPlan.nextPaymentDate = nextPaymentDate;
    }

    // Update payment status
    if (this.remainingBalance === 0) {
        this.paymentStatus = 'completed';
    } else if (this.remainingBalance < this.totalAmount) {
        this.paymentStatus = 'partial';
    }

    return this;
};

// Method to initiate refund
paymentSchema.methods.initiateRefund = function(reason, refundAmount = null) {
    this.refundDetails = {
        refundAmount: refundAmount || this.totalAmount,
        refundStatus: 'pending',
        refundReason: reason
    };

    // Update payment status
    this.paymentStatus = 'pending';

    return this;
};

// Method to process refund
paymentSchema.methods.processRefund = function(status) {
    if (!['processed', 'rejected'].includes(status)) {
        throw new Error('Invalid refund status');
    }

    this.refundDetails.refundStatus = status;
    
    if (status === 'processed') {
        this.paymentStatus = 'completed';
    }

    return this;
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
