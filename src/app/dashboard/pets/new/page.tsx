import { PetForm } from "@/components/PetForm";
import { ArrowLeft, PawPrint } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { redirect } from "next/navigation";

export const runtime = "edge";

export default async function NewPetPage() {
  const db = getDB();
  const auth = getAuth(db);
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const ownerId = session.user.id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit pb-12">
      {/* Dynamic Header */}
      <div className="bg-white px-6 pt-10 pb-12 rounded-b-[48px] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50 blur-3xl"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-8">
           <Link href="/dashboard">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-800 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                 <ArrowLeft className="w-6 h-6" />
              </div>
           </Link>
           <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-200">
              <PawPrint className="w-6 h-6" />
           </div>
        </div>

        <div className="relative z-10 space-y-2">
           <h1 className="text-3xl font-extrabold text-slate-900">새로운 아이 등록 🐾</h1>
           <p className="text-slate-400 font-medium">우리 아이의 안전을 위한 첫 걸음입니다.</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 container max-w-sm mx-auto mt-8 px-4">
         <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50">
            <PetForm ownerId={ownerId} />
         </div>
         
         <div className="mt-8 text-center px-6">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed">
              정보를 정확하게 입력하시면 발견 시 <br /> 훨씬 더 빠르게 연락을 받으실 수 있습니다.
            </p>
         </div>
      </div>
    </div>
  );
}
