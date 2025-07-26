const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// SAP delivery endpoint
const SAP_URL = `${process.env.SAP_BASE_URL}zsrv_customer_delivery?sap-client=${process.env.SAP_CLIENT}`;

router.get('/delivery/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr;

  const xmlBody = `
   <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZSD_CUST_DELIVERY_FM> 
        <KUNNR>${kunnr}</KUNNR>    
      </urn:ZSD_CUST_DELIVERY_FM>
   </soapenv:Body>
</soapenv:Envelope>

  `;

  try {
    const { data } = await axios.post(SAP_URL, xmlBody, {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
      },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
      responseType: 'text',
    });

    const result = await parseStringPromise(data);

    const envelopeKey = Object.keys(result).find(key => key.includes('Envelope'));
    if (!envelopeKey) throw new Error("SOAP Envelope not found");

    const bodyKey = Object.keys(result[envelopeKey]).find(key => key.includes('Body'));
    if (!bodyKey) throw new Error("SOAP Body not found");

    const body = result[envelopeKey][bodyKey][0];

    const responseKey = Object.keys(body).find(key => key.includes('ZSD_CUST_DELIVERY_FMResponse'));
    if (!responseKey) throw new Error("SAP Delivery Response not found");

    const response = body[responseKey][0];
    const deliveryItems = response.EV_DELIVERY_RES?.[0]?.item || [];

    const deliveryData = deliveryItems.map(item => ({
      vbeln: item.VBELN?.[0] || '',
      erdat: item.ERDAT?.[0] || '',
      vstel: item.VSTEL?.[0] || '',
      vkorg: item.VKORG?.[0] || '',
      lfart: item.LFART?.[0] || '',
      lfdat: item.LFDAT?.[0] || '',
      posnr: item.POSNR?.[0] || '',
      matnr: item.MATNR?.[0] || '',
      arktx: item.ARKTX?.[0] || '',
      lfimg: item.LFIMG?.[0] || '',
    }));

    res.json({
      success: true,
      data: deliveryData
    });

  } catch (err) {
    console.error('SAP Delivery Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'SAP connection failed',
      error: err.message
    });
  }
});

module.exports = router;