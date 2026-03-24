import { Lightning } from 'phosphor-react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
        <Lightning size={20} weight="fill" />
      </div>
      <span className="text-xl font-black text-secondary-900 tracking-tight">
        Rotinize<span className="text-primary-500">.</span>
      </span>
    </div>
  );
};

export default Logo;
