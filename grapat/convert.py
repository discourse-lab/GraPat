import os

from lxml import etree


def generate_xml(text_id, segments):
    doc_elm = etree.XML(
        '<annotation_bundle id="ab-%s" semantics="argumentation" />' % text_id)
    entity_elm = etree.XML('<entity id="%s" />' % text_id)

    for segment_id, segment in enumerate(segments):
        segment_elm = etree.XML('<token_range id="%d" />' % segment_id)
        segment_elm.text = etree.CDATA(segment)
        entity_elm.append(segment_elm)

    doc_elm.append(entity_elm)

    xmlstring = etree.tostring(
        doc_elm, encoding='UTF-8', pretty_print=True, xml_declaration=True)
    return xmlstring


def convert(filename, contents):
    if filename.endswith('rs3'):
        source_elm = etree.fromstring(contents)
        segments_elm = source_elm.xpath("/rst/body/segment")
        segments = [e.text for e in segments_elm]
    else:
        segments = [line for line in map(lambda l: l.strip(), contents.split("\n")) if len(line) > 0 and line[0] != "#"]
    text_id = os.path.splitext(os.path.basename(filename))[0]
    xmlstring = generate_xml(text_id, segments)
    outpath = os.path.join('static/data', text_id + '.xml')
    with open(outpath, 'wb') as outxml:
        outxml.write(xmlstring)
