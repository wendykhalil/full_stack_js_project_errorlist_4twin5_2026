import React, { useMemo, useState } from "react";
import { Search, ChevronDown, MoreVertical, Users } from "lucide-react";

const Pill = ({ children, tone = "slate" }) => {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-indigo-100 text-indigo-700",
    green: "bg-emerald-100 text-emerald-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        map[tone] ?? map.slate
      }`}
    >
      {children}
    </span>
  );
};

const roleTone = (role) => {
  if (role === "Artisan") return "slate";
  if (role === "Prescriber") return "slate";
  if (role === "Supplier") return "slate";
  return "slate";
};

const statusTone = (status) => {
  if (status === "Actif") return "green";
  if (status === "En attente") return "orange";
  if (status === "Suspendu") return "red";
  return "slate";
};

export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tous les rôles");

  const rows = [
    {
      name: "Ali Ben Salem",
      role: "Artisan",
      email: "ali@example.com",
      date: "15/12/2025",
      status: "Actif",
    },
    {
      name: "Fatima Trabelsi",
      role: "Prescriber",
      email: "fatima@example.com",
      date: "20/11/2025",
      status: "Actif",
    },
    {
      name: "BatiMat Tunisie",
      role: "Supplier",
      email: "contact@batimat.tn",
      date: "05/10/2025",
      status: "Actif",
    },
    {
      name: "Mohamed Gharbi",
      role: "Artisan",
      email: "mohamed@example.com",
      date: "01/02/2026",
      status: "En attente",
    },
    {
      name: "ColorPro SARL",
      role: "Supplier",
      email: "info@colorpro.tn",
      date: "12/09/2025",
      status: "Suspendu",
    },
  ];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return rows.filter((r) => {
      const matchesQuery =
        !query ||
        r.name.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.role.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "Tous les rôles" || r.role === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [q, roleFilter]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Title + filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Gestion des Utilisateurs
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gérez les comptes et permissions
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="relative w-full md:w-56">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option>Tous les rôles</option>
              <option>Artisan</option>
              <option>Prescriber</option>
              <option>Supplier</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table card */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Users className="h-5 w-5" />
          </span>
          Utilisateurs
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="border-b border-slate-200 pb-3 font-semibold">
                  Utilisateur
                </th>
                <th className="border-b border-slate-200 pb-3 font-semibold">
                  Rôle
                </th>
                <th className="border-b border-slate-200 pb-3 font-semibold">
                  Email
                </th>
                <th className="border-b border-slate-200 pb-3 font-semibold">
                  Date d'inscription
                </th>
                <th className="border-b border-slate-200 pb-3 text-center font-semibold">
                  Statut
                </th>
                <th className="border-b border-slate-200 pb-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u, idx) => (
                <tr key={idx} className="text-sm">
                  <td className="border-b border-slate-100 py-5">
                    <div className="font-medium text-slate-900">{u.name}</div>
                  </td>

                  <td className="border-b border-slate-100 py-5">
                    <Pill tone={roleTone(u.role)}>{u.role}</Pill>
                  </td>

                  <td className="border-b border-slate-100 py-5 text-slate-700">
                    {u.email}
                  </td>

                  <td className="border-b border-slate-100 py-5 text-slate-700">
                    {u.date}
                  </td>

                  <td className="border-b border-slate-100 py-5 text-center">
                    <Pill tone={statusTone(u.status)}>{u.status}</Pill>
                  </td>

                  <td className="border-b border-slate-100 py-5 text-right">
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100">
                      <MoreVertical className="h-4 w-4 text-slate-600" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
