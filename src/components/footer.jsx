export default function Footer() {
  return (
    <footer className="max-w-5xl p-4 md:p-8 mt-2 mx-auto bg-cyan-100 rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="container mx-auto text-center">
        <p className="font-khmer text-blue-600">&copy; {new Date().getFullYear()} Uzita. All rights reserved.</p>
      </div>
    </footer>
  );
}