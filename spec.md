# RideGo

## Current State
The app has a fully-featured ride booking flow for both riders and drivers. After completing a ride, riders see a RideBill component showing an itemized receipt (base fare, extra km, waiting charges, total, payment method). The bill is also accessible from ride history. Currently there is no way to save or share the bill.

## Requested Changes (Diff)

### Add
- PDF download button on the RideBill screen: generates a printable PDF of the receipt using the browser's print/save-as-PDF functionality (window.print with a styled print stylesheet, or using a blob URL approach)
- WhatsApp share button on the RideBill screen: opens WhatsApp with a pre-formatted text message containing the ride summary (receipt number, route, fare breakdown, total, payment method)

### Modify
- RideBill component: add two action buttons below the "Done" button -- "Download PDF" and "Share on WhatsApp"
- The PDF printout should be styled cleanly (hide non-bill elements) using a print media query or a dedicated printable div

### Remove
- Nothing

## Implementation Plan
1. Add a "Download PDF" button to RideBill that triggers window.print() with a print-specific CSS class on the bill card (hiding everything else)
2. Add a "Share via WhatsApp" button that constructs a wa.me URL with a formatted text of the ride receipt and opens it in a new tab
3. Add print CSS to index.css or inline styles to hide nav/header/footer when printing and show only the bill content
4. Add data-ocid markers for both new buttons
