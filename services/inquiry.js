const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// Use environment-configured SAP URL
const SAP_URL = `${process.env.SAP_BASE_URL}zsrv_cust54_inquiry2?sap-client=${process.env.SAP_CLIENT}`;

router.get('/inquiry/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr;
   console.log(kunnr);
  // XML SOAP request body with dynamic customer number
  const xmlBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZSD_CUST54_INQUIRY1_FM>
         <KUNNR>${kunnr}</KUNNR>
      </urn:ZSD_CUST54_INQUIRY1_FM>
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

    const result = await parseStringPromise(data, { explicitArray: true });

    // Modular parsing using known namespaces
    const envelope = result['soap-env:Envelope'];
    const body = envelope['soap-env:Body'][0];
  
   
    const response = body['n0:ZSD_CUST54_INQUIRY1_FMResponse'][0];
    const inquiryItems = response.EV_INQUIRY_REQ?.[0]?.item || [];

    const normalized = inquiryItems.map(item => ({
      vbeln: item.VBELN?.[0] || '',
      erdat: item.ERDAT?.[0] || '',
      auart: item.AUART?.[0] || '',
      netwr: item.NETWR?.[0] || '',
      waerk: item.WAERK?.[0] || '',
      vdatu: item.VDATU?.[0] || '',
      posnr: item.POSNR?.[0] || '',
      matnr: item.MATNR?.[0] || '',
      arktx: item.ARKTX?.[0] || '',
      kwmeng: item.KWMENG?.[0] || '',
      vrkme: item.VRKME?.[0] || '',
    }));
  console.log(normalized);
    res.json({
      success: true,
      data: normalized
    });

  } catch (err) {
    console.error('SAP Inquiry Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiry data',
      error: err.message,
    });
  }
});

module.exports = router;
