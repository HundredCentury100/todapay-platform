/**
 * Generate Apple Wallet (.pkpass) and Google Pay passes for tickets
 * Note: Full implementation requires backend API for signing passes
 */

interface WalletPassData {
  bookingReference: string;
  ticketNumber: string;
  itemName: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  type: 'bus' | 'event' | 'stay';
  // Bus specific
  from?: string;
  to?: string;
  date?: string;
  departureTime?: string;
  seats?: string[];
  // Event specific
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
  // Stay specific
  checkInDate?: string;
  checkOutDate?: string;
  propertyCity?: string;
}

/**
 * Generate Apple Wallet pass data structure
 * This prepares the data - actual .pkpass file requires backend signing with Apple certificates
 */
export const generateAppleWalletPass = (passData: WalletPassData) => {
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.fulticket.ticket",
    serialNumber: passData.bookingReference,
    teamIdentifier: "FULTICKET",
    organizationName: "fulticket",
    description: passData.type === 'bus' ? "Bus Ticket" : "Event Ticket",
    logoText: "fulticket",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(102, 126, 234)",
    labelColor: "rgb(255, 255, 255)",
    
    barcode: {
      message: passData.bookingReference,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: passData.bookingReference
    },

    boardingPass: passData.type === 'bus' ? {
      transitType: "PKTransitTypeBus",
      headerFields: [
        {
          key: "gate",
          label: "GATE",
          value: "TBA"
        }
      ],
      primaryFields: [
        {
          key: "origin",
          label: "FROM",
          value: passData.from || ""
        },
        {
          key: "destination", 
          label: "TO",
          value: passData.to || ""
        }
      ],
      secondaryFields: [
        {
          key: "departure",
          label: "DEPARTURE",
          value: passData.departureTime || ""
        },
        {
          key: "passenger",
          label: "PASSENGER",
          value: passData.passengerName
        }
      ],
      auxiliaryFields: [
        {
          key: "date",
          label: "DATE",
          value: passData.date || ""
        },
        {
          key: "seat",
          label: "SEAT",
          value: passData.seats?.join(', ') || "N/A"
        }
      ],
      backFields: [
        {
          key: "bookingRef",
          label: "Booking Reference",
          value: passData.bookingReference
        },
        {
          key: "ticketNum",
          label: "Ticket Number",
          value: passData.ticketNumber
        },
        {
          key: "terms",
          label: "Terms & Conditions",
          value: "Visit fulticket.com/terms for full terms"
        }
      ]
    } : undefined,

    eventTicket: passData.type === 'event' ? {
      headerFields: [
        {
          key: "event",
          label: "EVENT",
          value: passData.itemName
        }
      ],
      primaryFields: [
        {
          key: "eventName",
          label: "EVENT",
          value: passData.itemName
        }
      ],
      secondaryFields: [
        {
          key: "date",
          label: "DATE",
          value: passData.eventDate || ""
        },
        {
          key: "time",
          label: "TIME",
          value: passData.eventTime || ""
        }
      ],
      auxiliaryFields: [
        {
          key: "venue",
          label: "VENUE",
          value: passData.eventVenue || ""
        },
        {
          key: "seat",
          label: "SEAT",
          value: passData.seats?.join(', ') || "General Admission"
        }
      ],
      backFields: [
        {
          key: "attendee",
          label: "Attendee Name",
          value: passData.passengerName
        },
        {
          key: "bookingRef",
          label: "Booking Reference",
          value: passData.bookingReference
        },
        {
          key: "ticketNum",
          label: "Ticket Number",
          value: passData.ticketNumber
        }
      ]
    } : undefined
  };

  return passJson;
};

/**
 * Generate Google Pay pass data structure
 */
export const generateGooglePayPass = (passData: WalletPassData) => {
  const issuerId = "fulticket";
  const classId = passData.type === 'bus' ? `${issuerId}.bus_ticket` : `${issuerId}.event_ticket`;
  
  const passClass = passData.type === 'bus' ? {
    "id": classId,
    "issuerName": "fulticket",
    "reviewStatus": "UNDER_REVIEW",
    "transitType": "BUS",
    "logo": {
      "sourceUri": {
        "uri": "https://fulticket.com/logo.png"
      }
    },
    "hexBackgroundColor": "#667eea"
  } : {
    "id": classId,
    "issuerName": "fulticket",
    "reviewStatus": "UNDER_REVIEW",
    "eventName": {
      "defaultValue": {
        "language": "en",
        "value": passData.itemName
      }
    },
    "logo": {
      "sourceUri": {
        "uri": "https://fulticket.com/logo.png"
      }
    },
    "hexBackgroundColor": "#667eea"
  };

  const passObject = {
    "id": `${classId}.${passData.bookingReference}`,
    "classId": classId,
    "state": "ACTIVE",
    "barcode": {
      "type": "QR_CODE",
      "value": passData.bookingReference
    },
    "cardTitle": {
      "defaultValue": {
        "language": "en",
        "value": passData.type === 'bus' ? "Bus Ticket" : "Event Ticket"
      }
    },
    "header": {
      "defaultValue": {
        "language": "en",
        "value": passData.itemName
      }
    },
    "textModulesData": [
      {
        "id": "passenger",
        "header": "PASSENGER",
        "body": passData.passengerName
      },
      {
        "id": "booking",
        "header": "BOOKING REF",
        "body": passData.bookingReference
      }
    ]
  };

  // Add type-specific fields
  if (passData.type === 'bus') {
    (passObject as any).textModulesData.push(
      {
        "id": "origin",
        "header": "FROM",
        "body": passData.from
      },
      {
        "id": "destination",
        "header": "TO",
        "body": passData.to
      },
      {
        "id": "departure",
        "header": "DEPARTURE",
        "body": `${passData.date} ${passData.departureTime}`
      }
    );
  } else {
    (passObject as any).textModulesData.push(
      {
        "id": "venue",
        "header": "VENUE",
        "body": passData.eventVenue
      },
      {
        "id": "datetime",
        "header": "DATE & TIME",
        "body": `${passData.eventDate} ${passData.eventTime}`
      }
    );
  }

  return { passClass, passObject };
};

/**
 * Download wallet pass
 * In production, this would call a backend endpoint to generate signed passes
 */
export const downloadWalletPass = async (passData: WalletPassData) => {
  try {
    // For now, we'll provide instructions and download a JSON file
    // In production, this would call an edge function that signs the pass
    
    const applePass = generateAppleWalletPass(passData);
    const googlePass = generateGooglePayPass(passData);
    
    // Create downloadable JSON for reference
    const passInfo = {
      platform: "iOS and Android",
      message: "Wallet pass generation requires backend signing with platform certificates",
      appleWallet: applePass,
      googlePay: googlePass,
      instructions: {
        ios: "To add to Apple Wallet, this JSON needs to be signed with Apple certificates and packaged as .pkpass file",
        android: "To add to Google Pay, use Google Pay API with proper authentication"
      }
    };

    const blob = new Blob([JSON.stringify(passInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fulticket-pass-${passData.bookingReference}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: "Pass data generated. Full wallet integration requires backend implementation."
    };
  } catch (error) {
    console.error('Error generating wallet pass:', error);
    return { success: false, error };
  }
};
