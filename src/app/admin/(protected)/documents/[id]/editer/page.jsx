import AdminDocumentForm from '@/components/admin/AdminDocumentForm'

export default async function EditerDocumentPage({ params }) {
  const { id } = await params
  return <AdminDocumentForm mode="editer" id={id} />
}