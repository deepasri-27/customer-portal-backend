const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

const SAP_AGING_URL = `${process.env.SAP_BASE_URL}zsrv_cust54_aging1?sap-client=${process.env.SAP_CLIENT}`;

router.get('/aging/:kunnr', async (req, res) => {
  const { kunnr } = req.params;
 
  const xmlBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZSD_CUST54_AGING_FM>
         <KUNNR>${kunnr}</KUNNR>           
      </urn:ZSD_CUST54_AGING_FM>
   </soapenv:Body>
</soapenv:Envelope>
  `;

  try {
    const { data } = await axios.post(SAP_AGING_URL, xmlBody, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
      responseType: 'text',
    });

    const result = await parseStringPromise(data);

    // ✅ Use exact tag path structure from your XML screenshot
    const envelope = result['soap-env:Envelope'];
    const body = envelope['soap-env:Body'][0];
    const response = body['n0:ZSD_CUST54_AGING_FMResponse'][0];
    const agingItems = response.EV_AGING_RES?.[0]?.item || [];

    // Format data for frontend
    const formatted = agingItems.map(item => ({
      vbeln: item.VBELN?.[0] || '',
      fkdat: item.FKDAT?.[0] || '',
      due_dt: item.DUE_DT?.[0] || '',
      netwr: parseFloat(item.NETWR?.[0] || '0'),
      waerk: item.WAERK?.[0] || '',
      aging: parseInt(item.AGING?.[0] || '0'),
      meaning: item.MEANING?.[0] || ''
    }));
 
    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('SAP Aging Fetch Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch aging data' });
  }
});

module.exports = router;
