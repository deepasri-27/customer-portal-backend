const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// SAP URL for profile
const SAP_URL = `${process.env.SAP_BASE_URL}zsrv_cust_profile?sap-client=${process.env.SAP_CLIENT}`;

router.get('/profile/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr;

  const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:ZSD_CUST_PROFILE_FM>
          <KUNNR>${kunnr}</KUNNR>
        </urn:ZSD_CUST_PROFILE_FM>
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
   
    const result = await parseStringPromise(data, { explicitArray: false });

    const envelope = result['soap-env:Envelope'];
    const body = envelope['soap-env:Body'];
    const response = body['n0:ZSD_CUST_PROFILE_FMResponse'];
   
    if (!response) throw new Error('SAP Profile Response not found');

    const profile = {
      name1: response.EV_NAME1 || '',
      street: response.EV_STREET || '',
      city: response.EV_CITY || '',
      postcode: response.EV_POSTCODE || '',
      country: response.EV_COUNTRY || '',
    };
   console.log(profile);
    res.json({
      success: true,
      data: profile,
    });

  } catch (err) {
    console.error('SAP Profile Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'SAP connection failed',
      error: err.message,
    });
  }
});

module.exports = router;
