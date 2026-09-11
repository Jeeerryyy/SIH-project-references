/**
 * MCCPHP - OPD Emergency Boarding Pass Ticket Controller
 * Replicates interactive behaviors shown in 'QUEUE Ticket.jpeg'
 */

document.addEventListener('DOMContentLoaded', () => {
  const printBtn = document.getElementById('printTicketBtn');
  const digilockerBtn = document.getElementById('pushDigilockerBtn');
  const whatsappBtn = document.getElementById('sendWhatsappBtn');

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  if (digilockerBtn) {
    digilockerBtn.addEventListener('click', () => {
      alert('✅ Successfully synchronized OPD Token & Digital Health Pass to National DigiLocker (Linked to ABHA: ramesh@abdm)!');
    });
  }

  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      alert('📲 Sent Bilingual Marathi PDF + Audio Voice-Note of OPD Token to +91 98230 XXXXX!');
    });
  }
});
