const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// SAP WebService URL (adjusted for your new service)
const SAP_INVOICE_DATA_URL = `${process.env.SAP_BASE_URL}zsrv_cust54_get_invoicepdf?sap-client=${process.env.SAP_CLIENT}`;

router.get('/invoice-pdf/:vbeln', async (req, res) => {
  const vbeln = req.params.vbeln;

  const xmlBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZSD_CUST54_INVOICEPDF_PRINT_FM>
         <P_VBELN>${vbeln}</P_VBELN>
      </urn:ZSD_CUST54_INVOICEPDF_PRINT_FM>
   </soapenv:Body>
</soapenv:Envelope>
`;

  try {
    const { data } = await axios.post(SAP_INVOICE_DATA_URL, xmlBody, {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
      },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
      responseType: 'text',
    });

    const parsed = await parseStringPromise(data);

    const envelopeKey = Object.keys(parsed).find(k => k.includes('Envelope'));
    const bodyKey = Object.keys(parsed[envelopeKey]).find(k => k.includes('Body'));
    const body = parsed[envelopeKey][bodyKey][0];
    const responseKey = Object.keys(body).find(k => k.includes('ZSD_CUST54_INVOICEPDF_PRINT_FMResponse'));
    const response = body[responseKey][0];

    const base64Pdf = response.X_PDF?.[0] || '';

    if (!base64Pdf) {
      return res.status(404).json({ success: false, message: 'No PDF data returned from SAP' });
    }

    res.json({
      success: true,
      filename: `Invoice_${vbeln}.pdf`,
      base64: base64Pdf,
    });
  } catch (err) {
    console.error('Invoice Data SOAP Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice PDF',
      error: err.message,
    });
  }
});

module.exports = router;
