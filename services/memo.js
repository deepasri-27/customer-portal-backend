const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// SAP endpoint
const SAP_URL = `${process.env.SAP_BASE_URL}zsrv_cust54_memodetails?sap-client=${process.env.SAP_CLIENT}`;

router.get('/memo/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr;
  console.log(kunnr);
  const dateFrom = req.query.from || '';
  const dateTo = req.query.to || '';
  console.log("hit");
  const xmlBody = `
   <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZSD_CUST54_MEMO1_FM>
         <IV_KUNNR>${kunnr}</IV_KUNNR>
         <IV_DATE_FROM>${dateFrom}</IV_DATE_FROM>
         <IV_DATE_TO>${dateTo}</IV_DATE_TO>    
      </urn:ZSD_CUST54_MEMO1_FM>
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

    const envelopeKey = Object.keys(result).find(k => k.includes('Envelope'));
    const bodyKey = Object.keys(result[envelopeKey]).find(k => k.includes('Body'));
    const responseKey = Object.keys(result[envelopeKey][bodyKey][0]).find(k => k.includes('ZSD_CUST54_MEMO1_FMResponse'));

    const response = result[envelopeKey][bodyKey][0][responseKey][0];
    const memoItems = response.EV_MEMO_DETAILS?.[0]?.item || [];

    const memoData = memoItems.map(item => ({
      memoId: item.WF_MEMO_ID?.[0] || '',
      memoType: item.WF_MEMO_TYPE?.[0] || '',
      referenceDoc: item.WF_REFERENCE_DOC?.[0] || '',
      customerId: item.WF_CUSTOMER_ID?.[0] || '',
      customerName: item.WF_CUSTOMER_NAME?.[0] || '',
      billingDate: item.WF_BILLING_DATE?.[0] || '',
      createdDate: item.WF_CREATED_DATE?.[0] || '',
      createdBy: item.WF_CREATED_BY?.[0] || '',
      currency: item.WF_CURRENCY?.[0] || '',
      netValue: item.WF_NET_VALUE?.[0] || '',
      taxAmount: item.WF_TAX_AMOUNT?.[0] || '',
      salesOrg: item.WF_SALES_ORG?.[0] || '',
      distChannel: item.WF_DIST_CHANNEL?.[0] || '',
      division: item.WF_DIVISION?.[0] || '',
      direction:item.WF_MEMO_DIRECTION?.[0] || ''
    }));
   console.log(memoData)
    res.json({
      success: true,
      data: memoData
    });

  } catch (err) {
    console.error('SAP Memo Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'SAP connection failed',
      error: err.message
    });
  }
});

module.exports = router;
