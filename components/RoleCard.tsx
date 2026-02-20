'use client';

export default function RoleCard({ role }: any) {
  return (
    <div className="bg-gray-900 p-4 rounded space-y-3">

      <h2 className="text-xl font-bold">{role.name}</h2>
      <p className="text-sm text-gray-400">{role.role}</p>

      <div>
        <h3 className="font-semibold">🧍 Public Bio</h3>
        <p className="text-sm">{role.personality}</p>
      </div>

      <div>
        <h3 className="font-semibold">💔 Motive</h3>
        <p className="text-sm">{role.motive || "Unknown"}</p>
      </div>

      <div>
        <h3 className="font-semibold text-red-400">🔒 Hidden Secrets</h3>
        {role.secrets?.map((s: string, i: number) => (
          <div key={i} className="text-sm text-red-300">
            • {s}
          </div>
        ))}
      </div>

    </div>
  );
}