const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

const SAP_INVOICE_URL = `${process.env.SAP_BASE_URL}zsrv_cust54_invoice3?sap-client=${process.env.SAP_CLIENT}`;

router.get('/invoices/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr.trim();
  
  const xmlBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZSD_CUST54_INVOICE1_FM>
         <KUNNR>${kunnr}</KUNNR>
      </urn:ZSD_CUST54_INVOICE1_FM>
   </soapenv:Body>
</soapenv:Envelope>
`;

  try {
    const { data } = await axios.post(SAP_INVOICE_URL, xmlBody, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
      responseType: 'text',
    });

    const result = await parseStringPromise(data);

    // ✅ Using your exact syntax
    const envelope = result['soap-env:Envelope'];
    const body = envelope['soap-env:Body'][0];
    const response = body['n0:ZSD_CUST54_INVOICE1_FMResponse'][0];
    const invoiceItems = response.EV_INVOICE_RECEIPT?.[0]?.item || [];

    const formatted = invoiceItems.map(item => ({
      vbeln: item.VBELN?.[0] || '',
      fkdat: item.FKDAT?.[0] || '',
      netwr: parseFloat(item.NETWR?.[0] || '0'),
      waerk: item.WAERK?.[0] || '',
      kunag: item.KUNAG?.[0] || '',
      vkorg: item.VKORG?.[0] || '',
      knumv: item.KNUMV?.[0] || '',
      fkart: item.FKART?.[0] || '',
      posnr: item.POSNR?.[0] || '',
      matnr: item.MATNR?.[0] || '',
      arktx: item.ARKTX?.[0] || '',
      fkimg: parseFloat(item.FKIMG?.[0] || '0'),
      vrkme: item.VRKME?.[0] || '',
      item_netwr: parseFloat(item.ITEM_NETWR?.[0] || '0'),
      prsdt: item.PRSDT?.[0] || '',
      erdat: item.ERDAT?.[0] || '',
      ernam: item.ERNAM?.[0] || ''
    }));
   
    res.json({ success: true, data: formatted });

  } catch (err) {
    console.error('Invoice SOAP Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice data',
      error: err.message,
    });
  }
});

module.exports = router;
