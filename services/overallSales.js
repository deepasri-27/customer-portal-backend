const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// SAP SOAP Endpoint for ZJP_OVERALLSALES_FM
const SAP_OVERALL_SALES_URL = `${process.env.SAP_BASE_URL}zsrv_cust54_overallsales1?sap-client=${process.env.SAP_CLIENT}`;
 
router.get('/overall-sales/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr;

  const xmlBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZSD_CUST54_OVERALLSALES_FM>
         <IV_KUNNR>${kunnr}</IV_KUNNR>
      </urn:ZSD_CUST54_OVERALLSALES_FM>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const { data } = await axios.post(SAP_OVERALL_SALES_URL, xmlBody, {
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

    const envelope = result['soap-env:Envelope'];
    const body = envelope['soap-env:Body'][0];
    const response = body['n0:ZSD_CUST54_OVERALLSALES_FMResponse'][0];
    const records = response.EV_OVERALLSALES_RES?.[0]?.item || [];

    const formatted = records.map(item => ({
      waerk: item.WAERK?.[0] || '',
      auart: item.AUART?.[0] || '',
      kunnr: item.KUNNR?.[0] || '',
      vkorg: item.VKORG?.[0] || '',
      record_type: item.RECORD_TYPE?.[0] || '',
      document_no: item.DOCUMENT_NO?.[0] || '',
      doc_date: item.DOC_DATE?.[0] || '',
      total_orders: Number(item.TOTAL_ORDERS?.[0] || 0),
      total_order_value: Number(item.TOTAL_ORDER_VALUE?.[0] || 0),
      total_billed: Number(item.TOTAL_BILLED?.[0] || 0),
    }));
  
    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error('ZSD_CUST54_OVERALLSALES_FM SOAP Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overall sales data',
      error: err.message,
    });
  }
});

module.exports = router;
