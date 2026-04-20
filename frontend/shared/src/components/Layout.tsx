import React from "react";

interface LayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
}

export const Layout: React.FC<React.PropsWithChildren<LayoutProps>> = ({
  sidebar,
  header,
  children,
}) => {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4">{sidebar}</aside>
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4">{header}</header>
        <section className="p-6 overflow-auto">{children}</section>
      </main>
    </div>
  );
};