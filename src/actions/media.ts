'use server';
import { randomUUID } from 'node:crypto';
import { requireCapability, assertTargetId } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';
type Kind = 'product' | 'kit';
function destination(kind: unknown) { if(kind !== 'product' && kind !== 'kit') throw new Error('INVALID_MEDIA_KIND'); return kind === 'product' ? {bucket:'product-images',table:'products',column:'image_url'} : {bucket:'kit-banners',table:'kits',column:'banner_url'}; }
function managedPath(url: unknown, bucket: string): string {
 if(typeof url !== 'string') throw new Error('INVALID_MEDIA_REFERENCE');
 const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!configured) throw new Error('SERVER_DATABASE_UNCONFIGURED');
 const u = new URL(url), expected = new URL(configured), prefix='/storage/v1/object/public/'+bucket+'/';
 if(u.origin!==expected.origin || u.search || u.hash || !u.pathname.startsWith(prefix)) throw new Error('INVALID_MEDIA_REFERENCE');
 const key=u.pathname.slice(prefix.length);
 if(!/^managed\/(product|kit)\/[0-9a-f-]+\.(png|jpg|webp)$/.test(key)) throw new Error('UNMANAGED_MEDIA_REQUIRES_REVIEW');
 return key;
}
export async function uploadCatalogMedia(kind: Kind, form: FormData) {
 const actor=await requireCapability('storage.manage');
 const dest=destination(kind), file=form.get('file');
 if(!(file instanceof File) || file.size<24 || file.size>2*1024*1024) throw new Error('INVALID_MEDIA_FILE');
 const bytes=new Uint8Array(await file.arrayBuffer());
 let ext:string, mime:string;
 if(bytes[0]===0x89 && bytes[1]===0x50 && bytes[2]===0x4e && bytes[3]===0x47 && bytes[4]===13 && bytes[5]===10 && bytes[6]===26 && bytes[7]===10) {ext='png';mime='image/png';}
 else if(bytes[0]===255 && bytes[1]===216 && bytes[2]===255) {ext='jpg';mime='image/jpeg';}
 else if(String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP') {ext='webp';mime='image/webp';}
 else throw new Error('UNSUPPORTED_MEDIA_SIGNATURE');
 if(file.type!==mime) throw new Error('MEDIA_TYPE_MISMATCH');
 const key='managed/'+kind+'/'+randomUUID()+'.'+ext;
 const db=getServerDatabase(actor);
 const {error}=await db.storage.from(dest.bucket).upload(key,bytes,{upsert:false,contentType:mime});
 if(error) throw new Error('MEDIA_UPLOAD_FAILED');
 const {data}=db.storage.from(dest.bucket).getPublicUrl(key);
 return {path:key,url:data.publicUrl};
}
export async function replaceCatalogMedia(kind: Kind,id:string,form:FormData) {
 const actor=await requireCapability('storage.manage');assertTargetId(id);const dest=destination(kind);
 const db=getServerDatabase(actor);
 const existing=await db.from(dest.table).select('id').eq('id',id).single();
 if(existing.error || !existing.data) throw new Error('MEDIA_TARGET_NOT_FOUND');
 const uploaded=await uploadCatalogMedia(kind,form);
 const {error}=await db.from(dest.table).update({[dest.column]:uploaded.url}).eq('id',id);
 if(error) throw new Error('MEDIA_MAPPING_FAILED_RECOVERABLE_UPLOAD');
 // Previous blob retained: no irreversible overwrite or automatic purge.
 return uploaded;
}
export async function deleteCatalogMedia(kind:Kind,id:string) {
 const actor=await requireCapability('storage.manage');assertTargetId(id);const dest=destination(kind);
 const db=getServerDatabase(actor);
 const {data,error}=await db.from(dest.table).select(dest.column).eq('id',id).single();
 if(error || !data) throw new Error('MEDIA_TARGET_NOT_FOUND');
 const url=(data as unknown as Record<string,unknown>)[dest.column], key=managedPath(url,dest.bucket);
 const uses=await db.from(dest.table).select('id').eq(dest.column,url);
 if(uses.error || uses.data?.length!==1) throw new Error('MEDIA_SHARED_OR_UNKNOWN_USAGE');
 const other=dest.table==='products' ? {table:'kits',column:'banner_url'} : {table:'products',column:'image_url'};
 const otherUses=await db.from(other.table).select('id').eq(other.column,url);
 if(otherUses.error || !otherUses.data || otherUses.data.length) throw new Error('MEDIA_CROSS_TABLE_OR_UNKNOWN_USAGE');
 const cleared=await db.from(dest.table).update({[dest.column]:null}).eq('id',id);
 if(cleared.error) throw new Error('MEDIA_MAPPING_FAILED');
 const removed=await db.storage.from(dest.bucket).remove([key]);
 if(removed.error) throw new Error('MEDIA_BLOB_RETAINED_FOR_RECOVERY');
 return {success:true};
}

export interface KitBannerGalleryItem {
 url: string;
 name: string;
 createdAt?: string;
 source: 'bucket' | 'kit';
}

const PRESET_KIT_BANNER_PATHS = new Set([
 '/IMAGES/kit-chevere-semana.jpg',
 '/IMAGES/kit-chevere-semana2.jpeg',
 '/IMAGES/kit-chevere-semana3.jpeg',
]);

/** Lists uploaded and previously attached kit banners so admins can reuse past kit images. */
export async function listKitBannerGallery(): Promise<KitBannerGalleryItem[]> {
 const actor = await requireCapability('catalog.manage');
 const db = getServerDatabase(actor);
 const seen = new Set<string>();
 const items: KitBannerGalleryItem[] = [];

 const appendItem = (item: KitBannerGalleryItem) => {
  if (!item.url || PRESET_KIT_BANNER_PATHS.has(item.url) || seen.has(item.url)) return;
  seen.add(item.url);
  items.push(item);
 };

 for (const prefix of ['managed/kit', '']) {
  const { data: files, error } = await db.storage
   .from('kit-banners')
   .list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  if (error || !files) continue;
  for (const file of files) {
   if (!file.id || !file.name || file.name.startsWith('.')) continue;
   if (!/\.(png|jpe?g|webp)$/i.test(file.name)) continue;
   const fullKey = prefix ? `${prefix}/${file.name}` : file.name;
   const { data: pub } = db.storage.from('kit-banners').getPublicUrl(fullKey);
   appendItem({
    url: pub.publicUrl,
    name: file.name,
    createdAt: file.created_at ?? undefined,
    source: 'bucket',
   });
  }
 }

 const { data: kits } = await db
  .from('kits')
  .select('banner_url, name, updated_at, created_at')
  .not('banner_url', 'is', null)
  .order('updated_at', { ascending: false });

 for (const kit of kits || []) {
  const url = typeof kit.banner_url === 'string' ? kit.banner_url.trim() : '';
  if (!url) continue;
  appendItem({
   url,
   name: typeof kit.name === 'string' && kit.name.trim() ? kit.name : 'Banner de kit',
   createdAt: (kit.updated_at || kit.created_at || undefined) as string | undefined,
   source: 'kit',
  });
 }

 return items;
}
