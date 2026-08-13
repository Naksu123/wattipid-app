import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateAndShareReceipt = async (payment) => {
    try {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
                body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 40px; }
                .header h1 { color: #10B981; margin: 0; font-size: 32px; }
                .header p { color: #666; margin-top: 5px; }
                .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
                .info-table { width: 100%; margin-bottom: 30px; }
                .info-table td { padding: 5px; vertical-align: top; }
                .info-table td.title { font-weight: bold; color: #555; width: 120px; }
                .amount { font-size: 28px; font-weight: bold; color: #111; text-align: center; margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
                .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; }
                .verified-stamp { border: 3px solid #10B981; color: #10B981; font-weight: bold; padding: 10px 20px; display: inline-block; transform: rotate(-5deg); margin-top: 20px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <h1>WATTIPID</h1>
                    <p>Submetering Payment Receipt</p>
                </div>

                <table class="info-table">
                    <tr>
                        <td class="title">Receipt No:</td>
                        <td>#REC-${payment.id.toString().padStart(6, '0')}</td>
                        <td class="title" style="text-align: right;">Date:</td>
                        <td style="text-align: right;">${new Date(payment.paid_at).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <td class="title">Tenant Name:</td>
                        <td>${payment.tenant_name || 'Tenant'}</td>
                        <td class="title" style="text-align: right;">Room:</td>
                        <td style="text-align: right;">${payment.room_id}</td>
                    </tr>
                </table>

                <div class="amount">
                    Amount Paid: ₱${parseFloat(payment.amount).toFixed(2)}
                </div>

                <table class="info-table">
                    <tr>
                        <td class="title">Method:</td>
                        <td>${payment.payment_method.toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td class="title">Ref Number:</td>
                        <td>${payment.reference_number || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="title">Verified By:</td>
                        <td>Landlord</td>
                    </tr>
                </table>

                <div style="text-align: center;">
                    <div class="verified-stamp">OFFICIALLY VERIFIED</div>
                </div>

                <div class="footer">
                    <p>This is a system-generated official receipt.</p>
                    <p>Transaction ID: ${btoa(payment.id + '-' + payment.paid_at).substring(0, 15).toUpperCase()}</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        console.log('PDF generated at:', uri);
        
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download Receipt' });
        
        return { success: true };
    } catch (error) {
        console.error('Failed to generate receipt:', error);
        throw new Error('Failed to generate receipt. Please try again.');
    }
};
