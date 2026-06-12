import Panel from "@/components/ui/Panel";

const users = [
  {
    name: "Aarav Sharma",
    role: "Student",
  },
  {
    name: "Priya Nair",
    role: "Knight",
  },
];

export default function UserTable() {
  return (
    <Panel>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 text-left">
            <th className="pb-3 text-zinc-400">Name</th>
            <th className="pb-3 text-zinc-400">Role</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.name} className="border-b border-white/10">
              <td className="py-4 text-white">{user.name}</td>
              <td className="py-4 text-zinc-300">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
