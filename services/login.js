const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const SAP_URL = `${process.env.SAP_BASE_URL}zsrv_cust_loginservice?sap-client=${process.env.SAP_CLIENT}`;

exports.login = async (username, password) => {
  const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZSD_CUST_LOGIN54_FM>
         <WF_CUSTOMER>${username}</WF_CUSTOMER>
         <WF_PASSWORD>${password}</WF_PASSWORD>
      </urn:ZSD_CUST_LOGIN54_FM>
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
    console.log("Parsed SOAP Response:", JSON.stringify(result, null, 2));

    // Dynamically get Envelope key (namespace may differ)
    const envelopeKey = Object.keys(result).find(key => key.includes('Envelope'));
    if (!envelopeKey) throw new Error("SOAP Envelope not found");

    const bodyKey = Object.keys(result[envelopeKey]).find(key => key.includes('Body'));
    if (!bodyKey) throw new Error("SOAP Body not found");

    const body = result[envelopeKey][bodyKey][0];

    // Find your specific response key dynamically
    const responseKey = Object.keys(body).find(key => key.includes('ZSD_CUST_LOGIN54_FMResponse'));

    if (!responseKey) throw new Error("SAP Response not found");
    console.log("Working");
    const responseObj = body[responseKey][0];  
    const verify = responseObj['WF_VERIFY'][0];
    const kunnr = responseObj['KUNNR']?.[0] || username;
    
    return {
      status: verify === 'Successful',
      message: verify,
      kunnr
    };

  } catch (err) {
    console.error('SAP Login Error:', err.message);
    return {
      status: false,
      message: 'SAP connection failed',
    };
  }
};
