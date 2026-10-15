import './globals.css';

export const metadata = {
  title: 'AutoDamage AI Pakistan | Vehicle Damage Detection & Repair Cost Estimator',
  description: 'AI-powered vehicle damage detection and repair cost estimation for Pakistan. Using YOLOv11 & Google Gemini.',
  keywords: 'vehicle damage, car repair, Pakistan, AI detection, OLX parts, PakWheels'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
