import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, User, ArrowRight, LayoutDashboard } from 'lucide-react';

const DemoLinks: React.FC = () => {
    const navigate = useNavigate();

    const links = [
        {
            title: "Vista Cliente",
            description: "Accedé al menú digital como un cliente. Realizá pedidos y explorá el catálogo.",
            url: "/m/sanjuan-gourmet",
            icon: <User className="text-primary" size={32} />,
            color: "from-orange-500/20 to-primary/20",
            borderColor: "group-hover:border-primary/50"
        },
        {
            title: "Vista Administrador",
            description: "Gestioná pedidos, categorías y productos desde el panel de control.",
            url: "/admin/dashboard",
            icon: <LayoutDashboard className="text-blue-400" size={32} />,
            color: "from-blue-500/20 to-indigo-600/20",
            borderColor: "group-hover:border-blue-400/50"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-primary selection:text-white">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl text-center mb-16 px-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-primary mb-6 animate-in slide-in-from-top-10 duration-700">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Demo Experience
                </div>
                <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 italic tracking-tighter uppercase leading-none">
                    Menu<span className="text-primary">App</span> Demo
                </h1>
                <p className="text-gray-400 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    Elegí la vista que querés presentar a tus clientes. Profeisonalismo y eficiencia en un solo lugar.
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
                {links.map((link, idx) => (
                    <div 
                        key={idx}
                        onClick={() => navigate(link.url)}
                        className={`group relative glass p-8 sm:p-10 rounded-[2.5rem] cursor-pointer border border-white/5 transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_40px_100px_rgba(0,0,0,0.4)] ${link.borderColor} animate-in fade-in slide-in-from-bottom-10 duration-700 fill-mode-both`}
                        style={{ animationDelay: `${idx * 200}ms` }}
                    >
                        {/* Hover Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[2.5rem]`}></div>
                        
                        <div className="relative z-20 h-full flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="p-5 bg-white/5 rounded-3xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                                {link.icon}
                            </div>
                            <h2 className="text-3xl font-black text-white mb-4 uppercase italic flex items-center gap-3">
                                {link.title}
                                <ArrowRight className="group-hover:translate-x-2 transition-transform duration-500 text-gray-500" size={24} />
                            </h2>
                            <p className="text-gray-400 font-medium leading-relaxed mb-10 flex-grow">
                                {link.description}
                            </p>
                            
                            <div className="w-full flex items-center justify-between gap-4 mt-auto">
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                                    Click para abrir
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl text-white group-hover:bg-primary group-active:scale-95 transition-all">
                                    <ExternalLink size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="relative z-10 mt-20 text-gray-600 text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-1000">
                © 2024 MenuApp • Crafted for Perfection
            </footer>
        </div>
    );
};

export default DemoLinks;
